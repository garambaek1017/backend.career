import '../project-renderer.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { renderCareer } from './career.mjs';

const dataFile = new URL('../data/projects.json', import.meta.url);
const careerFile = new URL('../data/career.json', import.meta.url);
const linksFile = new URL('../data/links.json', import.meta.url);
const pageFile = new URL('../index.html', import.meta.url);

function renderContactLinks(links) {
  if (!links || typeof links !== 'object' || Array.isArray(links)) {
    throw new Error('links.json은 JSON 객체여야 합니다.');
  }
  const slots = [['github', 'GitHub'], ['blog', '기술 블로그'], ['youtube', 'YouTube']];
  return slots.map(([key, label]) => {
    const value = links[key];
    if (value === null || value === '') return `        <li><span>${label}</span></li>`;
    const error = `links.json의 ${key}에 HTTPS 주소 또는 null을 입력하세요.`;
    if (typeof value !== 'string') throw new Error(error);
    let url;
    try { url = new URL(value.trim()); }
    catch { throw new Error(error); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(error);
    const href = url.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return `        <li><a href="${href}">${label}</a></li>`;
  }).join('\n');
}

try {
  const projects = JSON.parse(readFileSync(dataFile, 'utf8').replace(/^\uFEFF/, ''));
  const career = JSON.parse(readFileSync(careerFile, 'utf8').replace(/^\uFEFF/, ''));
  const { duration, timeline } = renderCareer(career);
  const links = JSON.parse(readFileSync(linksFile, 'utf8').replace(/^\uFEFF/, ''));
  const contactLinks = renderContactLinks(links);
  const cards = globalThis.renderPortfolioProjects(projects);
  const page = readFileSync(pageFile, 'utf8');
  const cardBlock = /(<!-- projects:start -->)[\s\S]*?(<!-- projects:end -->)/;
  const dataBlock = /(<script id="project-data" type="application\/json">)[\s\S]*?(<\/script>)/;
  const careerDuration = /(<strong id="career-duration">)[^<]*(<\/strong>)/;
  const careerTimeline = /(<ul class="timeline" id="career-timeline">)[\s\S]*?(<\/ul>)/;
  const contactBlock = /(<ul class="contact-links" id="contact-links" aria-label="외부 링크">)[\s\S]*?(<\/ul>)/;
  if (![cardBlock, dataBlock, careerDuration, careerTimeline, contactBlock].every((pattern) => pattern.test(page))) {
    throw new Error('index.html에서 프로젝트, 경력 또는 연락처 영역을 찾지 못했습니다.');
  }
  const updated = page.replace(cardBlock, (_, start, end) => `${start}\n${cards}\n        ${end}`)
    .replace(careerDuration, (_, start, end) => `${start}${duration}${end}`)
    .replace(careerTimeline, (_, start, end) => `${start}\n${timeline}\n        ${end}`)
    .replace(contactBlock, (_, start, end) => `${start}\n${contactLinks}\n      ${end}`);
  const embedded = JSON.stringify(projects, null, 2).replaceAll('<', '\\u003c');
  writeFileSync(pageFile, updated.replace(dataBlock, (_, start, end) => start + '\n' + embedded + '\n' + end), 'utf8');
  console.log(`프로젝트 ${projects.length}개, 경력 ${duration}, 연락처 링크를 index.html에 반영했습니다.`);
} catch (error) {
  console.error(`포트폴리오 반영 실패: ${error.message}`);
  process.exitCode = 1;
}
