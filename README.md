<img width="141" height="300" alt="Screen Shot 2026-01-29 at 20 07 58" src="https://github.com/user-attachments/assets/893f5b52-5872-47dc-a76a-0d13e058c475" />

# lcd

my personal leetcode dashboard tracking progress to completing and mastering top 150.

https://lcd.jxh.io

mastery is measured by spaced repetition progress using my [lsr](https://github.com/jhead/lsr) app.

## stack

- react + ssr
- hono
- cloudflare workers (w/ D1 SQL)
- recharts
- claude

## how

- cron: scrapes my leetcode profile -> D1
- snapshots from lsr -> worker -> D1
