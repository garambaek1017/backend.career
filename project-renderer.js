'use strict';

globalThis.renderPortfolioProjects = (() => {
  function escapeHtml(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`${field} 항목에 비어 있지 않은 문자열을 입력해 주세요.`);
    }
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  }

  function renderProject(project, index) {
    const esc = (field) => escapeHtml(project[field], `프로젝트 ${index + 1}의 ${field}`);
    const responsibilities = project.responsibilities.map(({ title, description }) =>
      `              <li><strong>${escapeHtml(title, '담당 업무 제목')}</strong><br>${escapeHtml(description, '담당 업무 설명')}</li>`
    ).join('\n');
    const responsibilityList = responsibilities ? `
              <ul>
${responsibilities}
              </ul>` : '';
    const stack = project.techStack.map((technology) =>
      `<span>${escapeHtml(technology, '기술 스택')}</span>`
    ).join('');
    let technicalCase = '';
    if (project.technicalCase) {
      const { title, problem, solution, result } = project.technicalCase;
      technicalCase = `
              <section class="technical-case" aria-labelledby="technical-case-${index + 1}">
                <p class="technical-case-label">기술 사례</p>
                <h4 id="technical-case-${index + 1}">${escapeHtml(title, '기술 사례 제목')}</h4>
                <dl>
                  <div><dt>문제</dt><dd>${escapeHtml(problem, '문제')}</dd></div>
                  <div><dt>변경 내용</dt><dd>${escapeHtml(solution, '변경 내용')}</dd></div>
                  <div><dt>결과</dt><dd>${escapeHtml(result, '결과')}</dd></div>
                </dl>
              </section>`;
    }

    return `            <details class="project" id="project-${index + 1}">
            <summary>
              <span class="project-label">
                <span class="meta">${esc('company')} · ${esc('period')}</span>
                <span class="project-title">${esc('title')}</span>
                <span class="project-caption">${esc('summary')}</span>
              </span>
              <span class="toggle" aria-hidden="true"><span class="when-closed">자세히 보기</span><span class="when-open">접기</span><span class="toggle-icon"><img class="clay-icon" src="assets/clay-arrow.png" width="21" height="21" alt=""></span></span>
            </summary>
            <div class="project-body">
              <p>${esc('description')}</p>${technicalCase}${responsibilityList}
              <p class="stack-label">기술 스택</p>
              <div class="tags">${stack}</div>
            </div>
          </details>`;
  }

  return function renderPortfolioProjects(projects) {
    if (!Array.isArray(projects)) throw new Error('projects.json의 최상위 값은 배열이어야 합니다.');
    const companies = new Map();
    projects.forEach((project, index) => {
      const card = renderProject(project, index);
      const company = project.company.trim();
      if (!companies.has(company)) companies.set(company, []);
      companies.get(company).push(card);
    });

    return Array.from(companies, ([company, cards], index) => {
      const headingId = `project-company-${index + 1}`;
      return `        <section class="project-company" aria-labelledby="${headingId}">
          <h3 id="${headingId}" class="project-company-title">${escapeHtml(company, '회사명')}</h3>
          <div class="company-projects">
${cards.join('\n')}
          </div>
        </section>`;
    }).join('\n');
  };
})();
