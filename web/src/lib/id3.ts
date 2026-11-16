// Reads the ID3v2 tag at the start of an MP3 (versions 2.2, 2.3 and 2.4): the
// text fields the admin form pre-fills and the embedded cover image.
// Pure functions over bytes, so they can be unit tested without any network.

export interface Id3Tag {
  title: string | null;
  artist: string | null;
  album: string | null;
  /** Recording date or year exactly as stored, e.g. "2024" or "2024-05-12". */
  date: string | null;
  /** Raw bytes of the first embedded picture. */
  picture: Buffer | null;
}

const HEADER_SIZE = 10;

/** 4 bytes holding 7 bits each (ID3 "synchsafe" integer). */
function synchsafe(buf: Buffer, at: number): number {
  return ((buf[at] & 0x7f) << 21) | ((buf[at + 1] & 0x7f) << 14) | ((buf[at + 2] & 0x7f) << 7) | (buf[at + 3] & 0x7f);
}

/**
 * Total byte length of the ID3v2 tag (header included) from the first 10 bytes
 * of the file, or null when the file doesn't start with one.
 */
export function id3TagSize(start: Buffer): number | null {
  if (start.length < HEADER_SIZE || start.toString("latin1", 0, 3) !== "ID3") return null;
  if (start[3] < 2 || start[3] > 4) return null;
  const hasFooter = start[3] === 4 && (start[5] & 0x10) !== 0;
  return HEADER_SIZE + synchsafe(start, 6) + (hasFooter ? 10 : 0);
}

/** Undoes ID3 "unsynchronisation": every FF 00 pair was written for a plain FF. */
function removeUnsync(data: Buffer): Buffer {
  const out = Buffer.alloc(data.length);
  let length = 0;
  for (let i = 0; i < data.length; i++) {
    out[length++] = data[i];
    if (data[i] === 0xff && data[i + 1] === 0x00) i++;
  }
  return out.subarray(0, length);
}

/** Index of the string terminator at or after `from` (two zero bytes for UTF-16), or -1. */
function findTerminator(data: Buffer, from: number, encoding: number): number {
  if (encoding === 1 || encoding === 2) {
    for (let i = from; i + 1 < data.length; i += 2) {
      if (data[i] === 0 && data[i + 1] === 0) return i;
    }
    return -1;
  }
  return data.indexOf(0, from);
}

function decodeText(data: Buffer, encoding: number): string {
  if (encoding === 1 || encoding === 2) {
    let bigEndian = encoding === 2;
    let bytes = data;
    if (data.length >= 2 && data[0] === 0xff && data[1] === 0xfe) {
      bigEndian = false;
      bytes = data.subarray(2);
    } else if (data.length >= 2 && data[0] === 0xfe && data[1] === 0xff) {
      bigEndian = true;
      bytes = data.subarray(2);
    }
    const even = bytes.subarray(0, bytes.length - (bytes.length % 2));
    return bigEndian ? Buffer.from(even).swap16().toString("utf16le") : even.toString("utf16le");
  }
  return data.toString(encoding === 3 ? "utf8" : "latin1");
}

/** A text frame: one encoding byte, then the text (only the first value is kept). */
function readTextFrame(data: Buffer): string | null {
  if (data.length < 2) return null;
  const encoding = data[0];
  const end = findTerminator(data, 1, encoding);
  const text = decodeText(data.subarray(1, end === -1 ? data.length : end), encoding).trim();
  return text || null;
}

/** A picture frame (APIC, or PIC in v2.2): returns just the image bytes. */
function readPictureFrame(data: Buffer, isV22: boolean): Buffer | null {
  if (data.length < 6) return null;
  const encoding = data[0];
  let at: number;
  if (isV22) {
    at = 1 + 3; // three-letter image format
  } else {
    const mimeEnd = data.indexOf(0, 1); // MIME type is always Latin-1
    if (mimeEnd === -1) return null;
    at = mimeEnd + 1;
  }
  at += 1; // picture type
  const descriptionEnd = findTerminator(data, at, encoding);
  if (descriptionEnd === -1) return null;
  at = descriptionEnd + (encoding === 1 || encoding === 2 ? 2 : 1);
  return at < data.length ? data.subarray(at) : null;
}

const isFrameId = (buf: Buffer, at: number, length: number): boolean => {
  if (at + length > buf.length) return false;
  for (let i = at; i < at + length; i++) {
    const c = buf[i];
    if (!((c >= 0x41 && c <= 0x5a) || (c >= 0x30 && c <= 0x39))) return false;
  }
  return true;
};

const FIELD_BY_FRAME: Record<string, "title" | "artist" | "album" | "date"> = {
  TIT2: "title", TT2: "title",
  TPE1: "artist", TP1: "artist",
  TALB: "album", TAL: "album",
  TDRC: "date", TYER: "date", TYE: "date",
};
// Fallback only: the album artist is used when there's no track artist.
const ALBUM_ARTIST_FRAMES = new Set(["TPE2", "TP2"]);

/**
 * Parses an ID3v2 tag. `buf` must start at the beginning of the file; it may be
 * cut short (frames that don't fit are skipped), so text fields can still be
 * read from a partial download.
 */
export function parseId3(buf: Buffer): Id3Tag {
  const tag: Id3Tag = { title: null, artist: null, album: null, date: null, picture: null };
  const total = id3TagSize(buf);
  if (total === null) return tag;

  const version = buf[3];
  const flags = buf[5];
  const tagUnsync = (flags & 0x80) !== 0;
  let body = buf.subarray(HEADER_SIZE, Math.min(total, buf.length));
  // Before v2.4 unsynchronisation covers the whole tag; in v2.4 it is per frame.
  if (tagUnsync && version < 4) body = removeUnsync(body);

  let at = 0;
  if (version >= 3 && (flags & 0x40) !== 0 && body.length >= 4) {
    // Extended header: skip it.
    at = version === 3 ? 4 + body.readUInt32BE(0) : synchsafe(body, 0);
  }

  const idLength = version === 2 ? 3 : 4;
  const frameHeader = version === 2 ? 6 : 10;
  let albumArtist: string | null = null;

  while (at + frameHeader <= body.length && isFrameId(body, at, idLength)) {
    const id = body.toString("latin1", at, at + idLength);
    let size: number;
    if (version === 2) {
      size = body.readUIntBE(at + 3, 3);
    } else if (version === 3) {
      size = body.readUInt32BE(at + 4);
    } else {
      size = synchsafe(body, at + 4);
      // Some writers store v2.4 sizes as plain integers. If the synchsafe size
      // doesn't land on another frame (or the padding), trust the plain one.
      const next = at + frameHeader + size;
      const landsWell = next >= body.length || body[next] === 0 || isFrameId(body, next, 4);
      if (!landsWell) {
        const plain = body.readUInt32BE(at + 4);
        const plainNext = at + frameHeader + plain;
        if (plainNext === body.length || body[plainNext] === 0 || isFrameId(body, plainNext, 4)) size = plain;
      }
    }
    const dataStart = at + frameHeader;
    const dataEnd = dataStart + size;
    if (size === 0 || dataEnd > body.length) break; // empty, or cut off by a partial download

    let data = body.subarray(dataStart, dataEnd);
    let readable = true;
    if (version === 4) {
      const formatFlags = body[at + 9];
      if (formatFlags & 0x0c) readable = false; // compressed or encrypted
      if (formatFlags & 0x01) data = data.subarray(4); // data length indicator
      if (tagUnsync || formatFlags & 0x02) data = removeUnsync(data);
    } else if (version === 3 && body[at + 9] & 0xc0) {
      readable = false; // compressed or encrypted
    }

    if (readable) {
      const field = FIELD_BY_FRAME[id];
      if (field) {
        if (tag[field] === null) tag[field] = readTextFrame(data);
      } else if (ALBUM_ARTIST_FRAMES.has(id)) {
        albumArtist = albumArtist ?? readTextFrame(data);
      } else if ((id === "APIC" || id === "PIC") && tag.picture === null) {
        tag.picture = readPictureFrame(data, version === 2);
      }
    }
    at = dataEnd;
  }

  if (tag.artist === null) tag.artist = albumArtist;
  return tag;
}
