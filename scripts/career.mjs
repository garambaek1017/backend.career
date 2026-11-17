function monthIndex(value) {
  const match = typeof value === 'string' && /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) throw new Error(`경력 날짜를 YYYY-MM 형식으로 입력하세요: ${value}`);
  return Number(match[1]) * 12 + Number(match[2]) - 1;
}

function escapeText(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function renderCareer(career, now = new Date()) {
  if (!Array.isArray(career)) throw new Error('career.json의 최상위 값은 배열이어야 합니다.');
  const current = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric'
  }).formatToParts(now);
  const presentMonth = Number(current.find(({ type }) => type === 'year').value) * 12
    + Number(current.find(({ type }) => type === 'month').value) - 1;
  const workedMonths = new Set();

  const items = career.map(({ company, start, end, role }) => {
    const first = monthIndex(start);
    const last = end === null ? presentMonth : monthIndex(end);
    if (last < first) throw new Error(`${company}의 종료 월이 시작 월보다 빠릅니다.`);
    for (let month = first; month <= last; month++) workedMonths.add(month);
    const period = `${start.replace('-', '.')} – ${end === null ? '현재' : end.replace('-', '.')}`;
    return `          <li><strong>${escapeText(company)}</strong><span>${period}${role ? ' · ' + escapeText(role) : ''}</span></li>`;
  });

  const years = Math.floor(workedMonths.size / 12);
  const months = workedMonths.size % 12;
  const duration = [years && `${years}년`, months && `${months}개월`].filter(Boolean).join(' ') || '0개월';
  return { duration, timeline: items.join('\n') };
}
