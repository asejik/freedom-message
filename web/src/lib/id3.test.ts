import { describe, expect, it } from "vitest";
import { id3TagSize, parseId3 } from "./id3";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0x00, 0xff, 0xd9]);

function synchsafe(n: number): Buffer {
  return Buffer.from([(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f]);
}

function uint32(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

/** A v2.3 / v2.4 frame. `plainSize` writes a v2.4 size the wrong (non-synchsafe) way. */
function frame(version: 3 | 4, id: string, data: Buffer, plainSize = false): Buffer {
  const size = version === 4 && !plainSize ? synchsafe(data.length) : uint32(data.length);
  return Buffer.concat([Buffer.from(id, "latin1"), size, Buffer.from([0, 0]), data]);
}

function tag(version: 2 | 3 | 4, frames: Buffer[], flags = 0, padding = 0): Buffer {
  const body = Buffer.concat([...frames, Buffer.alloc(padding)]);
  return Buffer.concat([Buffer.from("ID3"), Buffer.from([version, 0, flags]), synchsafe(body.length), body]);
}

const latin1Text = (text: string) => Buffer.concat([Buffer.from([0]), Buffer.from(text, "latin1")]);
const utf8Text = (text: string) => Buffer.concat([Buffer.from([3]), Buffer.from(text, "utf8"), Buffer.from([0])]);
const utf16Text = (text: string) =>
  Buffer.concat([Buffer.from([1, 0xff, 0xfe]), Buffer.from(text, "utf16le"), Buffer.from([0, 0])]);
const apic = (image: Buffer) =>
  Buffer.concat([Buffer.from([0]), Buffer.from("image/jpeg\0", "latin1"), Buffer.from([3, 0]), image]);

describe("id3TagSize", () => {
  it("returns the whole tag length, header included", () => {
    expect(id3TagSize(tag(3, [frame(3, "TIT2", latin1Text("Grace"))]))).toBe(10 + 10 + 6);
  });

  it("returns null when the file has no ID3v2 tag", () => {
    expect(id3TagSize(Buffer.from([0xff, 0xfb, 0x90, 0x00, 0, 0, 0, 0, 0, 0]))).toBeNull();
    expect(id3TagSize(Buffer.from("ID3"))).toBeNull();
  });
});

describe("parseId3", () => {
  it("reads text fields and the cover from a v2.3 tag", () => {
    const parsed = parseId3(
      tag(3, [
        frame(3, "TIT2", utf16Text("The Power of Faith")),
        frame(3, "TPE1", latin1Text("Apostle Muyiwa Areo")),
        frame(3, "TALB", latin1Text("Faith Series")),
        frame(3, "TYER", latin1Text("2024")),
        frame(3, "APIC", apic(JPEG)),
      ], 0, 64),
    );
    expect(parsed.title).toBe("The Power of Faith");
    expect(parsed.artist).toBe("Apostle Muyiwa Areo");
    expect(parsed.album).toBe("Faith Series");
    expect(parsed.date).toBe("2024");
    expect(parsed.picture?.equals(JPEG)).toBe(true);
  });

  it("reads a v2.4 tag with UTF-8 text", () => {
    const parsed = parseId3(
      tag(4, [frame(4, "TIT2", utf8Text("Ọpẹ́")), frame(4, "TDRC", utf8Text("2025-03-09")), frame(4, "APIC", apic(JPEG))]),
    );
    expect(parsed.title).toBe("Ọpẹ́");
    expect(parsed.date).toBe("2025-03-09");
    expect(parsed.picture?.equals(JPEG)).toBe(true);
  });

  it("copes with v2.4 frame sizes written as plain integers", () => {
    const bigImage = Buffer.concat([JPEG.subarray(0, 4), Buffer.alloc(300, 7)]);
    const parsed = parseId3(
      tag(4, [frame(4, "APIC", apic(bigImage), true), frame(4, "TIT2", utf8Text("After the picture"))]),
    );
    expect(parsed.picture?.equals(bigImage)).toBe(true);
    expect(parsed.title).toBe("After the picture");
  });

  it("reads a v2.2 tag", () => {
    const v22 = (id: string, data: Buffer) =>
      Buffer.concat([Buffer.from(id, "latin1"), Buffer.from([0, 0, data.length]), data]);
    const pic = Buffer.concat([Buffer.from([0]), Buffer.from("JPG"), Buffer.from([3, 0]), JPEG]);
    const parsed = parseId3(tag(2, [v22("TT2", latin1Text("Old File")), v22("PIC", pic)]));
    expect(parsed.title).toBe("Old File");
    expect(parsed.picture?.equals(JPEG)).toBe(true);
  });

  it("undoes unsynchronisation on a v2.3 tag", () => {
    // The whole tag body is rewritten after the frames are built: a zero byte
    // goes after every FF that is followed by 00 or by E0 and above.
    const body = frame(3, "APIC", apic(JPEG));
    const stored: number[] = [];
    body.forEach((byte, i) => {
      stored.push(byte);
      const next = body[i + 1];
      if (byte === 0xff && (next === undefined || next === 0x00 || next >= 0xe0)) stored.push(0x00);
    });
    expect(stored.length).toBeGreaterThan(body.length);
    const parsed = parseId3(tag(3, [Buffer.from(stored)], 0x80));
    expect(parsed.picture?.equals(JPEG)).toBe(true);
  });

  it("falls back to the album artist when there is no track artist", () => {
    expect(parseId3(tag(3, [frame(3, "TPE2", latin1Text("Pastor Temi"))])).artist).toBe("Pastor Temi");
    expect(
      parseId3(tag(3, [frame(3, "TPE2", latin1Text("Band")), frame(3, "TPE1", latin1Text("Speaker"))])).artist,
    ).toBe("Speaker");
  });

  it("keeps the text fields when the download stops before the picture ends", () => {
    const full = tag(3, [frame(3, "TIT2", latin1Text("Partial")), frame(3, "APIC", apic(JPEG))]);
    const parsed = parseId3(full.subarray(0, full.length - 5));
    expect(parsed.title).toBe("Partial");
    expect(parsed.picture).toBeNull();
  });

  it("returns an empty result for a file without a tag", () => {
    expect(parseId3(Buffer.from("not an mp3 at all"))).toEqual({
      title: null, artist: null, album: null, date: null, picture: null,
    });
  });
});
