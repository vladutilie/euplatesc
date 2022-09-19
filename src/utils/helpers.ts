export const prepareTS = (): string => {
  const roDate = new Date().toLocaleString('ro', { timeZone: 'Europe/Bucharest' });
  const dt = new Date(roDate);
  const date: { [k: string]: string } = {
    y: dt.getFullYear().toString(),
    mo: (dt.getMonth() + 1).toString().padStart(2, '0'),
    d: dt.getDate().toString().padStart(2, '0'),
    h: dt.getHours().toString().padStart(2, '0'),
    mi: dt.getMinutes().toString().padStart(2, '0'),
    s: dt.getSeconds().toString().padStart(2, '0')
  };

  let timestamp = '';
  for (const t in date) {
    timestamp += date[t as string];
  }

  return timestamp;
};
