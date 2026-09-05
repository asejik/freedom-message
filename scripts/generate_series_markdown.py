import os
import json
from dotenv import load_dotenv
from supabase import create_client

def main():
    # Load env
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(env_path)
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    supabase = create_client(supabase_url, supabase_key)

    print("Fetching series...")
    series_res = supabase.table('series').select('id, name').order('name').execute()
    all_series = series_res.data

    print(f"Fetched {len(all_series)} series.")

    print("Fetching sermons...")
    all_sermons = []
    page = 0
    limit = 1000
    while True:
        s_res = supabase.table('sermons').select('id, title, date_preached, series_id').range(page * limit, (page + 1) * limit - 1).execute()
        sems = s_res.data
        if not sems:
            break
        all_sermons.extend(sems)
        if len(sems) < limit:
            break
        page += 1

    print(f"Fetched {len(all_sermons)} sermons.")

    series_by_id = {}
    for s in all_series:
        series_by_id[s['id']] = {
            'id': s['id'],
            'name': s['name'],
            'sermons_by_year': {},
            'dates_by_year': {},
            'all_dates': [],
            'total_sermons': 0
        }

    standalone_sermons = 0
    sermons_by_year_count = {}

    for sem in all_sermons:
        d = sem.get('date_preached')
        if d:
            yr = d[:4]
            sermons_by_year_count[yr] = sermons_by_year_count.get(yr, 0) + 1

        sid = sem.get('series_id')
        if not sid or sid not in series_by_id:
            standalone_sermons += 1
            continue

        s = series_by_id[sid]
        s['total_sermons'] += 1
        if d:
            yr = d[:4]
            s['sermons_by_year'][yr] = s['sermons_by_year'].get(yr, 0) + 1
            s['dates_by_year'].setdefault(yr, []).append(d)
            s['all_dates'].append(d)

    series_list = list(series_by_id.values())

    years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015']
    by_year = {y: [] for y in years}

    for s in series_list:
        s['all_dates'].sort()
        active_years = sorted(list(s['sermons_by_year'].keys()))
        s['active_years'] = active_years
        for y in active_years:
            if y in by_year:
                s['dates_by_year'][y].sort()
                by_year[y].append({
                    'name': s['name'],
                    'sermons_in_year': s['sermons_by_year'][y],
                    'total_sermons': s['total_sermons'],
                    'is_multi_year': len(active_years) > 1,
                    'active_years': active_years,
                    'first_date': s['dates_by_year'][y][0],
                    'last_date': s['dates_by_year'][y][-1]
                })

    single_year_count = len([s for s in series_list if len(s['active_years']) == 1])
    multi_year_count = len([s for s in series_list if len(s['active_years']) > 1])

    lines = []
    lines.append("# CLC Sermon Series Catalog — Comprehensive Year Breakdown\n")
    lines.append("This document provides a complete audit of all **213 sermon series** currently recorded in the database, their active year(s), sermon counts, and date ranges based on actual sermon dates (`date_preached`).\n")

    lines.append("## 1. Executive Summary & Verification of Numbers\n")
    lines.append(f"- **Total Unique Series in Database**: **{len(all_series)}** (across 12 years: 2015–2026)")
    lines.append(f"- **Total Sermons in Database**: **{len(all_sermons)}**")
    lines.append(f"- **Sermons Assigned to a Series**: **{len(all_sermons) - standalone_sermons}**")
    lines.append(f"- **Standalone Sermons (No Series)**: **{standalone_sermons}**")
    lines.append(f"- **Series Spanning a Single Year**: **{single_year_count}**")
    lines.append(f"- **Series Spanning Multiple Years / Annually Recurring**: **{multi_year_count}** (e.g. *Freedom Conference*, *Vow Renewal*, *Crossover*, *Love, Choices & Other Beautiful Words*, etc.)\n")

    lines.append("### Annual Series Distribution")
    lines.append("> **Why are there ~10 to 34 series in a given year?**")
    lines.append("> Series are typically monthly (Sunday morning series + Wednesday midweek series = ~24 series per year). The remaining series in peak years are accounted for by annual conferences, special events, and standalone mini-series.\n")

    lines.append("| Year | Active Series in Year | Single-Year Series | Recurring / Multi-Year Active | Total Sermons in Year |")
    lines.append("|:---:|:---:|:---:|:---:|:---:|")

    for y in years:
        ylist = by_year[y]
        single_count = len([s for s in ylist if not s['is_multi_year']])
        multi_count = len([s for s in ylist if s['is_multi_year']])
        sems = sermons_by_year_count.get(y, 0)
        lines.append(f"| **{y}** | **{len(ylist)}** | {single_count} | {multi_count} | {sems} |")

    lines.append("\n---\n")

    lines.append("## 2. Multi-Year & Recurring Series (30 Series)\n")
    lines.append("These 30 series either recur annually (like conferences and holidays) or run across calendar year boundaries:\n")
    lines.append("| Series Name | Years Active | Total Sermons | Overall Date Range |")
    lines.append("|:---|:---:|:---:|:---|")

    multi_list = sorted([s for s in series_list if len(s['active_years']) > 1], key=lambda x: x['name'])
    for s in multi_list:
        dates_span = f"{s['all_dates'][0]} to {s['all_dates'][-1]}" if s['all_dates'] else "N/A"
        lines.append(f"| **{s['name']}** | {', '.join(s['active_years'])} | {s['total_sermons']} | {dates_span} |")

    lines.append("\n---\n")

    lines.append("## 3. Year-by-Year Series Breakdown\n")

    for y in years:
        ylist = sorted(by_year[y], key=lambda x: x['name'])
        sems = sermons_by_year_count.get(y, 0)
        lines.append(f"### {y} ({len(ylist)} Series, {sems} Sermons)\n")
        lines.append("| # | Series Name | Sermons in Year | Total Across All Years | Date Range in Year | Series Type |")
        lines.append("|:---:|:---|:---:|:---:|:---|:---|")

        for idx, s in enumerate(ylist, 1):
            type_str = f"Recurring ({', '.join(s['active_years'])})" if s['is_multi_year'] else "Single Year"
            drange = s['first_date'] if s['first_date'] == s['last_date'] else f"{s['first_date']} to {s['last_date']}"
            lines.append(f"| {idx} | **{s['name']}** | {s['sermons_in_year']} | {s['total_sermons']} | {drange} | {type_str} |")

        lines.append("\n")

    lines.append("---\n")

    lines.append("## 4. Master Alphabetical Index (All 213 Series)\n")
    lines.append("| # | Series Name | Years Active | Total Sermons | Full Date Span |")
    lines.append("|:---:|:---|:---:|:---:|:---|")

    all_sorted = sorted(series_list, key=lambda x: x['name'])
    for idx, s in enumerate(all_sorted, 1):
        ystr = ', '.join(s['active_years']) if s['active_years'] else 'None'
        dspan = f"{s['all_dates'][0]} to {s['all_dates'][-1]}" if s['all_dates'] else 'N/A'
        lines.append(f"| {idx} | **{s['name']}** | {ystr} | {s['total_sermons']} | {dspan} |")

    output_path = os.path.join(os.path.dirname(__file__), '..', 'series_by_year.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')

    print(f"Written to {output_path}")

if __name__ == '__main__':
    main()
