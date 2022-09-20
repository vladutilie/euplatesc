export const prepareTS = (): string => {
  const dt = new Date();
  const date: { [k: string]: string } = {
    y: dt.getUTCFullYear().toString(),
    mo: (dt.getUTCMonth() + 1).toString().padStart(2, '0'),
    d: dt.getUTCDate().toString().padStart(2, '0'),
    h: dt.getUTCHours().toString().padStart(2, '0'),
    mi: dt.getUTCMinutes().toString().padStart(2, '0'),
    s: dt.getUTCSeconds().toString().padStart(2, '0')
  };

  let timestamp = '';
  for (const t in date) {
    timestamp += date[t as string];
  }

  return timestamp;
};
