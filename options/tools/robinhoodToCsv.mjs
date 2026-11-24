// usage: node tocsv.mjs <bodiesOnlyOutsideRTH:0|1> files... > out.csv
import fs from 'node:fs';
const [, , bodies, ...files] = process.argv;
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const rows = new Map();
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const b of j.data.results[0].bars) {
    if (b.interpolated) continue;
    const p = Object.fromEntries(fmt.formatToParts(new Date(b.begins_at)).map((x) => [x.type, x.value]));
    let o = +b.open_price, h = +b.high_price, l = +b.low_price, c = +b.close_price;
    if (bodies === '1' && b.session !== 'reg') { h = Math.max(o, c); l = Math.min(o, c); }
    rows.set(b.begins_at, `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute},${o},${h},${l},${c}`);
  }
}
console.log('datetime,open,high,low,close');
for (const k of [...rows.keys()].sort()) console.log(rows.get(k));
