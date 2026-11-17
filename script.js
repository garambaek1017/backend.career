const trigger = document.querySelector('.zoom-trigger');
const dialog = document.querySelector('#image-dialog');
const preview = trigger.querySelector('img');
const enlarged = dialog.querySelector('img');

trigger.addEventListener('click', () => {
  enlarged.src = preview.getAttribute('src');
  dialog.showModal();
});
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => trigger.focus({ preventScroll: true }));

const menu = document.querySelectorAll('.site-header nav a');
function updateMenu() {
  menu.forEach((link) => {
    if (link.hash === location.hash) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('hashchange', updateMenu);
updateMenu();

const cards = document.querySelector('.projects');
const toggleAllProjects = document.querySelector('#toggle-all-projects');
const toggleAllText = toggleAllProjects.querySelector('span');
const toggleAllIcon = toggleAllProjects.querySelector('img');

function syncProjectToggle() {
  toggleAllProjects.hidden = !cards.querySelector('.project');
  const allOpen = !toggleAllProjects.hidden && !cards.querySelector('.project:not([open])');
  toggleAllText.textContent = allOpen ? '모두 접기' : '모두 펼치기';
  toggleAllIcon.classList.toggle('clay-arrow-up', allOpen);
}

toggleAllProjects.addEventListener('click', () => {
  const shouldOpen = Boolean(cards.querySelector('.project:not([open])'));
  for (const card of cards.querySelectorAll('.project')) card.open = shouldOpen;
  syncProjectToggle();
});
cards.addEventListener('toggle', syncProjectToggle, true);
syncProjectToggle();

const pawButton = document.querySelector('#paw-sound');
const catMeow = document.querySelector('#cat-meow');
catMeow.volume = 0.28;
const pawClickWindow = 2000;
let pawClicks = [];

pawButton.addEventListener('click', () => {
  const now = performance.now();
  pawClicks = pawClicks.filter(time => now - time <= pawClickWindow);
  pawClicks.push(now);
  if (pawClicks.length === 1) {
    catMeow.currentTime = 0;
    catMeow.play().catch(() => {});
  }
  if (pawClicks.length === 3) {
    pawClicks = [];
    editorStatus.textContent = '';
    projectEditor.showModal();
  }
});

const projectEditor = document.querySelector('#project-editor');
const editorStatus = document.querySelector('#editor-status');
const projectSelect = document.querySelector('#project-select');
const projectFields = document.querySelector('#project-fields');
const fields = [...projectFields.querySelectorAll('[data-project-field]')];
const stack = document.querySelector('#project-stack');
const duties = document.querySelector('#responsibility-list');
const dutyTemplate = document.querySelector('#responsibility-template');

let projects = JSON.parse(document.querySelector('#project-data').textContent);
let selectedIndex = projects.length ? 0 : -1;

function projectLabel(project, index) {
  return project.title.trim() || `새 프로젝트 ${index + 1}`;
}

function appendDuty(title = '', description = '') {
  const row = dutyTemplate.content.firstElementChild.cloneNode(true);
  const titleInput = row.querySelector('[data-duty-title]');
  titleInput.value = title;
  row.querySelector('[data-duty-description]').value = description;
  row.querySelector('[data-remove-duty]').addEventListener('click', () => {
    row.remove();
    document.querySelector('#add-responsibility').focus();
  });
  duties.append(row);
  return titleInput;
}

function storeProjectFields() {
  if (selectedIndex < 0) return;
  const project = projects[selectedIndex];
  for (const input of fields) project[input.dataset.projectField] = input.value;
  project.techStack = stack.value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  project.responsibilities = [...duties.children].map((row) => ({
    title: row.querySelector('[data-duty-title]').value,
    description: row.querySelector('[data-duty-description]').value
  }));
  projectSelect.options[selectedIndex].textContent = projectLabel(project, selectedIndex);
}

function showProjectFields(index) {
  selectedIndex = index;
  projectSelect.selectedIndex = index;
  projectFields.hidden = index < 0;
  if (index < 0) return;
  const project = projects[index];
  for (const input of fields) input.value = project[input.dataset.projectField];
  stack.value = project.techStack.join('\n');
  duties.replaceChildren();
  for (const duty of project.responsibilities) appendDuty(duty.title, duty.description);
}

function refreshProjectOptions(index) {
  const options = projects.map((project, position) =>
    new Option(projectLabel(project, position), String(position))
  );
  projectSelect.replaceChildren(...options);
  projectSelect.disabled = projects.length === 0;
  showProjectFields(index);
}

refreshProjectOptions(selectedIndex);
projectEditor.addEventListener('close', () => {
  storeProjectFields();
  pawButton.focus({ preventScroll: true });
});

projectSelect.addEventListener('change', () => {
  const nextIndex = projectSelect.selectedIndex;
  storeProjectFields();
  showProjectFields(nextIndex);
  editorStatus.textContent = '';
});
document.querySelector('#add-project').addEventListener('click', () => {
  storeProjectFields();
  projects.push({ title: '', company: '', period: '', summary: '', description: '', responsibilities: [], techStack: [] });
  refreshProjectOptions(projects.length - 1);
  editorStatus.textContent = '새 프로젝트를 추가했습니다. 내용을 입력하세요.';
  fields[0].focus();
});
document.querySelector('#add-responsibility').addEventListener('click', () => appendDuty().focus());

function applyProjectChanges() {
  storeProjectFields();
  cards.innerHTML = globalThis.renderPortfolioProjects(projects);
  syncProjectToggle();
  return JSON.stringify(projects, null, 2) + '\n';
}
document.querySelector('#apply-projects').addEventListener('click', () => {
  try {
    applyProjectChanges();
    projectEditor.close();
    document.querySelector('#projects').scrollIntoView();
  } catch (error) {
    editorStatus.textContent = `입력 내용을 확인하세요. ${error.message}`;
  }
});

document.querySelector('#open-projects').addEventListener('click', () => {
  document.querySelector('#project-file').click();
});
document.querySelector('#project-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const importedProjects = JSON.parse(text.replace(/^\uFEFF/, ''));
    globalThis.renderPortfolioProjects(importedProjects);
    projects = importedProjects;
    refreshProjectOptions(projects.length ? 0 : -1);
    editorStatus.textContent = 'JSON 파일을 불러왔습니다.';
  } catch (error) {
    editorStatus.textContent = `파일을 열 수 없습니다: ${error.message}`;
  } finally {
    event.target.value = '';
  }
});

document.querySelector('#save-projects').addEventListener('click', async () => {
  try {
    const content = applyProjectChanges();
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const file = await window.showSaveFilePicker({
          suggestedName: 'projects.json',
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await file.createWritable();
        await writable.write(content);
        await writable.close();
        editorStatus.textContent = 'JSON을 저장했습니다. 새로고침 후에도 보려면 HTML에 반영하세요.';
        return;
      } catch (error) {
        if (error.name === 'AbortError') {
          editorStatus.textContent = '파일 저장을 취소했습니다.';
          return;
        }
        if (!['SecurityError', 'NotAllowedError'].includes(error.name)) throw error;
      }
    }
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projects.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    editorStatus.textContent = '다운로드한 파일을 data/projects.json에 저장한 뒤 update-portfolio.bat을 실행하세요.';
  } catch (error) {
    editorStatus.textContent = `저장할 수 없습니다: ${error.message}`;
  }
});
