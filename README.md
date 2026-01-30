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
