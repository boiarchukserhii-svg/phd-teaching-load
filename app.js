(() => {
  'use strict';
  const data = window.TEACHING_DATA || {faculties:[],departments:[],programs:[],disciplines:[]};
  const faculties = data.faculties || [], departments = data.departments || [], programs = data.programs || [], disciplines = data.disciplines || [];
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalize = value => String(value || '').normalize('NFC').toLocaleLowerCase('uk-UA').replace(/[’ʼ']/g,'').trim();
  const includes = (value, query) => normalize(query).split(/\s+/).filter(Boolean).every(word => normalize(value).includes(word));
  const facultyById = new Map(faculties.map(item => [item.id,item]));
  const departmentById = new Map(departments.map(item => [item.id,item]));
  const programById = new Map(programs.map(item => [item.id,item]));
  const students = (data.students || []).filter(item=>item.academicYear === data.academicYear);
  const studentSummary = programId => {
    const records = students.filter(item=>item.programId === programId);
    if (!records.length) return '';
    const courses = [...new Set(records.map(item=>item.course))].sort((a,b)=>a-b);
    return courses.map(course=>{
      const cohort = records.filter(item=>item.course === course).sort((a,b)=>a.semester-b.semester);
      return `<p><strong>Аспіранти · ${esc(course)} курс · ${esc(data.academicYear)}</strong><br>${cohort.map(item=>`${esc(item.semester)} семестр: ${esc(item.count)}`).join(' · ')}</p>`;
    }).join('');
  };
  const disciplineFaculty = item => item.facultyId || programById.get(item.programId)?.facultyId;
  const facultyName = id => facultyById.get(id)?.name || 'Підрозділ не зазначено';
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3Z"/>',
    book:'<path d="M12 5v16M3 4c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 2-3-3-6-3-9-2Z"/>',
    program:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v8l4-3 4 3V3M8 16h8"/>',
    layers:'<path d="m3 7 9-4 9 4-9 4ZM3 12l9 4 9-4M3 17l9 4 9-4"/>',
    building:'<path d="M3 21h18M5 21V8h14v13M3 8l9-5 9 5M9 12v2m6-2v2M10 21v-4h4v4"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
  };
  const icon = key => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key] || icons.book}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(node => {node.innerHTML = icon(node.dataset.icon);});
  let view = 'overview';
  const returnStack = [];
  const backLabels = {overview:'до огляду',faculties:'до факультетів та ННІ',departments:'до кафедр',programs:'до ОНП',disciplines:'до дисциплін'};
  const backButtons = new Map();
  for (const name of ['faculties','departments','programs','disciplines']) {
    const button = document.createElement('button');
    button.type = 'button';button.id = 'back-from-'+name;button.className = 'reset';
    button.style.margin = '18px 0 0';button.hidden = true;
    $('view-'+name).prepend(button);backButtons.set(name,button);
    button.onclick = () => {
      const previous = returnStack.pop();
      if (!previous) return;
      for (const [id,value] of previous.filters) $(id).value = value;
      setView(previous.view,false);
      window.scrollTo({top:previous.scrollTop,behavior:'instant'});
      const target = previous.target && $('view-'+previous.view).querySelector(previous.target);
      (target || $('view-'+previous.view).querySelector('h2')).focus({preventScroll:true});
    };
  }
  function rememberOrigin(target) {
    returnStack.push({view,scrollTop:window.scrollY,target,
      filters:[...$('view-'+view).querySelectorAll('.filters input,.filters select')].map(node=>[node.id,node.value])});
  }
  function updateBackButtons() {
    const previous = returnStack.at(-1);
    for (const [name,button] of backButtons) {
      button.hidden = name !== view || !previous;
      button.textContent = previous ? '← Назад '+backLabels[previous.view] : '';
    }
  }
  function setView(name, moveFocus = true) {
    if (!['overview','disciplines','departments','programs','faculties'].includes(name)) name = 'overview';
    view = name;
    document.querySelectorAll('.view').forEach(section => {section.hidden = section.id !== 'view-'+view;});
    document.querySelectorAll('.bottom-nav [data-view]').forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle('current',active);button.setAttribute('aria-current',active?'page':'false');
    });
    render();
    updateBackButtons();
    if (moveFocus) {
      const heading = $('view-'+view).querySelector('h2');
      heading.focus({preventScroll:true});
      const back = backButtons.get(view);
      (back && !back.hidden ? back : heading).scrollIntoView({block:'start',behavior:'instant'});
    }
  }
  document.querySelectorAll('[data-view]').forEach(button => {button.onclick = () => {
    returnStack.length = 0;
    setView(button.dataset.view);
  };});
  const facultyOptions = '<option value="">Усі підрозділи</option>'+faculties.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');
  $('discipline-faculty').innerHTML = facultyOptions;
  $('department-faculty').innerHTML = facultyOptions;
  $('program-faculty').innerHTML = facultyOptions;
  $('discipline-total').textContent = disciplines.length;
  $('department-total').textContent = departments.length;
  $('faculty-total').textContent = faculties.length;
  $('program-total').textContent = programs.length;
  if (disciplines.length || departments.length) $('data-status').textContent = data.academicYear ? 'Навчальний рік: '+data.academicYear : 'Навчальний рік не зазначено';
  else if (programs.length) $('data-status').textContent = 'Довідник ОНП заповнено';
  if (programs.length && !disciplines.length && !departments.length) {
    document.querySelector('#view-overview .welcome p').textContent = 'Освітньо-наукові програми вже додано. Оберіть факультет або ННІ, щоб переглянути його програми. Кафедри та дисципліни ще не додано.';
  }
  if (disciplines.length) {
    document.querySelector('#view-overview .welcome p').textContent = 'Освітньо-наукові програми та дисципліни вже додано. Оберіть факультет, програму або відкрийте всі дисципліни. Оберіть кафедру, щоб переглянути її дисципліни на всіх освітньо-наукових програмах.';
    if (!data.academicYear) $('data-status').textContent = 'Дисципліни додано';
  }
  if (students.length) {
    const cohorts = new Map();
    for (const item of students) {
      const key = JSON.stringify([item.programId,item.course]);
      cohorts.set(key,Math.max(cohorts.get(key) || 0,item.count));
    }
    const total = [...cohorts.values()].reduce((sum,count)=>sum+count,0);
    const paragraph = document.createElement('p');paragraph.className = 'data-status';paragraph.id = 'aspirant-summary';
    paragraph.textContent = `Аспірантів: ${total} · 1 курс · Однакова кількість у 1 та 2 семестрах`;
    $('data-status').after(paragraph);
  }
  const formatHours = value => value == null ? '—' : esc(new Intl.NumberFormat('uk-UA').format(value));
  const hoursDetails = item => {
    const hours = item.hours;
    if (!hours) return '';
    return `<div class="discipline-hours"><p><strong>Години за навчальним планом</strong></p>
      <p>Усього: <strong>${formatHours(hours.total)}</strong> · Аудиторні: <strong>${formatHours(hours.classroom)}</strong></p>
      <p>Лекції: ${formatHours(hours.lectures)} · Практичні: ${formatHours(hours.practical)} · Лабораторні: ${formatHours(hours.laboratory)}</p>
      <p>Самостійна робота: ${formatHours(hours.independent)}</p>
      ${hours.assessment ? `<p>Форма контролю: ${esc(hours.assessment)}</p>` : ''}</div>`;
  };
  const sharedMemberships = data.sharedGroups || [];
  const lessonLabels = {lectures:'Лекції',practical:'Практичні',laboratory:'Лабораторні'};
  const sharedDetails = item => {
    const memberships = sharedMemberships.filter(entry=>entry.disciplineId === item.id && entry.academicYear === data.academicYear);
    const details = memberships.map(entry=>{
      const members = sharedMemberships.filter(other=>other.groupCode === entry.groupCode &&
        other.academicYear === entry.academicYear && other.course === entry.course && other.semester === entry.semester &&
        other.departmentId === entry.departmentId && other.lessonType === entry.lessonType);
      const names = [...new Set(members.map(other=>programById.get(other.programId)?.name).filter(Boolean))].sort(alphabet.compare);
      return `<p><strong>${esc(lessonLabels[entry.lessonType])} — спільна група:</strong><br>${names.map(esc).join('; ')}</p>`;
    }).join('');
    const share = item.departmentWorkloadShare == null ? '' : `<p><strong>Частка цієї кафедри у навантаженні: ${esc(item.departmentWorkloadShare*100)}%</strong></p>`;
    return details || share ? `<div class="shared-groups">${details}${share}</div>` : '';
  };
  const departmentLabel = item => departmentById.get(item.departmentId)?.name ||
    (item.departmentCode ? 'Код кафедри: '+item.departmentCode : 'Кафедру не зазначено');
  const semesters = [...new Set(disciplines.map(item=>item.semester).filter(value=>value != null))].sort((a,b)=>a-b);
  $('discipline-semester').innerHTML = '<option value="">Усі семестри</option>'+semesters.map(value=>`<option value="${esc(value)}">${esc(value)} семестр</option>`).join('');
  const types = [...new Set(disciplines.map(item=>item.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'uk'));
  $('discipline-type').innerHTML = '<option value="">Усі типи</option>'+types.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('');
  function empty(title, message, symbol = 'book') {
    return `<div class="empty"><span>${icon(symbol)}</span><h3>${esc(title)}</h3><p>${esc(message)}</p></div>`;
  }
  function render() {
    if (view === 'disciplines') renderDisciplines();
    if (view === 'departments') renderDepartments();
    if (view === 'faculties') renderFaculties();
    if (view === 'programs') renderPrograms();
  }
  const typeOrder = value => {
    const normalized = normalize(value);
    if (normalized.startsWith('обов')) return 0;
    if (normalized.startsWith('фах')) return 1;
    if (normalized.startsWith('вибір')) return 2;
    return 3;
  };
  const typeHeading = value => ['Обов’язкові дисципліни','Фахові дисципліни','Вибіркові дисципліни'][typeOrder(value)] || value || 'Тип не зазначено';
  const alphabet = new Intl.Collator('uk', {sensitivity:'base',numeric:true});
  const compareDisciplines = (a,b) => (Number(a.semester) || Infinity)-(Number(b.semester) || Infinity) ||
    typeOrder(a.type)-typeOrder(b.type) || alphabet.compare(a.type || '',b.type || '') ||
    alphabet.compare(a.name,b.name) || alphabet.compare(programById.get(a.programId)?.name || '',programById.get(b.programId)?.name || '') ||
    alphabet.compare(departmentLabel(a),departmentLabel(b));
  const disciplineGroupKey = item => JSON.stringify([item.departmentId,item.semester,normalize(item.name).replace(/\s+/g,' ')]);
  const programmeNames = items => [...new Set(items.map(item=>programById.get(item.programId)?.name || 'Не зазначено'))].sort(alphabet.compare);
  function groupedDisciplineDetails(items) {
    const names = programmeNames(items);
    const programmes = `<p><strong>Освітньо-наукові програми (${names.length}):</strong><br>${names.map(esc).join('; ')}</p>`;
    const plans = new Map();
    for (const item of items) {
      const key = JSON.stringify(item.hours || null);
      if (!plans.has(key)) plans.set(key,[]);
      plans.get(key).push(item);
    }
    const hours = [...plans.values()].map(plan=>
      (plans.size>1 ? `<p><strong>Варіант навчального плану:</strong> ${programmeNames(plan).map(esc).join('; ')}</p>` : '')+hoursDetails(plan[0])).join('');
    const sessions = new Map();
    for (const item of items) {
      for (const entry of sharedMemberships.filter(entry=>entry.disciplineId === item.id && entry.academicYear === data.academicYear)) {
        const key = JSON.stringify([entry.groupCode,entry.academicYear,entry.course,entry.semester,entry.departmentId,entry.lessonType]);
        if (!sessions.has(key)) sessions.set(key,entry);
      }
    }
    let teaching = '';
    for (const lesson of ['lectures','practical','laboratory']) {
      for (const entry of sessions.values()) {
        if (entry.lessonType !== lesson) continue;
        const members = sharedMemberships.filter(other=>other.groupCode === entry.groupCode && other.academicYear === entry.academicYear &&
          other.course === entry.course && other.semester === entry.semester && other.departmentId === entry.departmentId && other.lessonType === lesson);
        const groupNames = [...new Set(members.map(member=>programById.get(member.programId)?.name).filter(Boolean))].sort(alphabet.compare);
        teaching += `<p><strong>${esc(lessonLabels[lesson])} — спільна група:</strong><br>${groupNames.map(esc).join('; ')}</p>`;
      }
      const separate = items.filter(item=>Number(item.hours?.[lesson])>0 && !sharedMemberships.some(entry=>entry.disciplineId === item.id && entry.academicYear === data.academicYear && entry.lessonType === lesson));
      if (separate.length) teaching += `<p><strong>${esc(lessonLabels[lesson])} — окремо в кожній ОНП:</strong><br>${programmeNames(separate).map(esc).join('; ')}</p>`;
    }
    const shares = [...new Set(items.map(item=>item.departmentWorkloadShare).filter(value=>value!=null))];
    const share = shares.length === 1 ? `<p><strong>Частка цієї кафедри у навантаженні: ${esc(shares[0]*100)}%</strong></p>` : '';
    const types = [...new Set(items.map(item=>item.type))];
    const typeDetails = types.length>1 ? items.map(item=>`<p>${esc(programById.get(item.programId)?.name)}: ${esc(item.type)}</p>`).join('') : '';
    return programmes+typeDetails+hours+`<div class="shared-groups">${teaching}${share}</div>`;
  }
  function renderDisciplines() {
    const selectedProgram = $('discipline-program').value;
    const availablePrograms = programs.filter(item=>!$('discipline-faculty').value || item.facultyId === $('discipline-faculty').value);
    $('discipline-program').innerHTML = '<option value="">Усі програми</option>'+availablePrograms.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');
    if (availablePrograms.some(item=>item.id === selectedProgram)) $('discipline-program').value = selectedProgram;
    const selected = $('discipline-department').value;
    const scopedDepartmentIds = new Set(disciplines.filter(item=>
      (!$('discipline-faculty').value || disciplineFaculty(item) === $('discipline-faculty').value) &&
      (!$('discipline-program').value || item.programId === $('discipline-program').value)).map(item=>item.departmentId));
    const available = departments.filter(item=>(!$('discipline-faculty').value && !$('discipline-program').value) || scopedDepartmentIds.has(item.id));
    $('discipline-department').innerHTML = '<option value="">Усі кафедри</option>'+available.map(item=>`<option value="${esc(item.id)}">${esc(item.code?item.code+' · ':'')}${esc(item.name)}</option>`).join('');
    if (available.some(item=>item.id===selected)) $('discipline-department').value = selected;
    const entries = disciplines.filter(item=>includes([item.name,item.departmentCode,departmentById.get(item.departmentId)?.code,departmentById.get(item.departmentId)?.name,facultyName(disciplineFaculty(item)),programById.get(item.programId)?.name].join(' '),$('discipline-query').value) &&
      (!$('discipline-faculty').value || disciplineFaculty(item) === $('discipline-faculty').value) &&
      (!$('discipline-program').value || item.programId === $('discipline-program').value) &&
      (!$('discipline-department').value || item.departmentId === $('discipline-department').value) &&
      (!$('discipline-semester').value || String(item.semester) === $('discipline-semester').value) &&
      (!$('discipline-type').value || item.type === $('discipline-type').value)).sort(compareDisciplines);
    const grouped = !!$('discipline-department').value && !$('discipline-program').value;
    const buckets = new Map();
    if (grouped) for (const item of entries) {
      const key = disciplineGroupKey(item);
      if (!buckets.has(key)) buckets.set(key,[]);
      buckets.get(key).push(item);
    }
    const shown = grouped ? [...buckets.values()].map(members=>({...members[0],members})).sort(compareDisciplines) : entries;
    $('discipline-count').textContent = (grouped ? 'Дисциплін: ' : 'Записів: ')+shown.length;
    $('discipline-list').innerHTML = shown.length ? shown.map((item,index)=>{
      const previous = shown[index-1];
      const newSemester = !previous || previous.semester !== item.semester;
      const newType = newSemester || previous.type !== item.type;
      const heading = (newSemester ? `<h3 class="semester-heading">${item.semester?esc(item.semester)+' семестр':'Семестр не зазначено'}</h3>` : '') +
        (newType ? `<h4 class="type-heading">${esc(typeHeading(item.type))}</h4>` : '');
      return heading+`<article class="card"><div class="discipline-tags"><span class="pill">${item.semester?esc(item.semester)+' семестр':'Семестр не зазначено'}</span>${item.type?`<span class="pill discipline-type">${esc(item.type)}</span>`:''}</div><h3>${esc(item.name)}</h3><p>${esc(grouped ? departmentLabel(item) : facultyName(disciplineFaculty(item)))}</p>${grouped ? groupedDisciplineDetails(item.members) : `<p>ОНП: ${esc(programById.get(item.programId)?.name || 'Не зазначено')}</p><p>${esc(departmentLabel(item))}</p>${hoursDetails(item)}${sharedDetails(item)}`}</article>`;}).join('') :
      disciplines.length ? empty('Нічого не знайдено','Спробуйте змінити пошук або скинути фільтри.') :
        empty('Дисципліни ще не додано',$('discipline-faculty').value?facultyName($('discipline-faculty').value):'Тут відображатимуться дисципліни освітньо-наукових програм.');
  }
  function renderDepartments() {
    const entries = departments.filter(item=>includes([item.name,item.code].join(' '),$('department-query').value) && (!$('department-faculty').value || item.facultyId === $('department-faculty').value));
    $('department-count').textContent = 'Кафедр: '+entries.length;
    $('department-list').innerHTML = entries.length ? entries.map(item=>`<article class="card"><span class="pill">${esc(item.code || 'Кафедра')}</span><h3>${esc(item.name)}</h3><p>${esc(facultyName(item.facultyId))}</p><button type="button" class="open-records" data-department="${esc(item.id)}">Переглянути дисципліни →</button></article>`).join('') :
      departments.length ? empty('Нічого не знайдено','Спробуйте змінити пошук або скинути фільтри.','layers') : empty('Кафедри ще не додано','Тут відображатиметься перелік кафедр та їхніх дисциплін.','layers');
  }
  function renderPrograms() {
    const entries = programs.filter(item=>includes([item.name,item.specialty,item.code].join(' '),$('program-query').value) &&
      (!$('program-faculty').value || item.facultyId === $('program-faculty').value));
    $('program-count').textContent = 'Програм: '+entries.length;
    $('program-list').innerHTML = entries.length ? entries.map(item=>`<article class="card"><span class="pill">Освітньо-наукова програма</span><h3>${esc(item.name)}</h3><p>${esc(facultyName(item.facultyId))}</p>${item.specialty?`<p>Спеціальність: ${esc(item.specialty)}</p>`:''}${studentSummary(item.id)}<button type="button" class="open-records" data-program="${esc(item.id)}">Переглянути дисципліни →</button></article>`).join('') :
      programs.length ? empty('Нічого не знайдено','Спробуйте змінити пошук або скинути фільтри.','program') :
      empty('Освітньо-наукові програми ще не додано',$('program-faculty').value?facultyName($('program-faculty').value):'Тут відображатимуться програми факультетів та навчально-наукових інститутів.','program');
  }
  function renderFaculties() {
    const entries = faculties.filter(item=>includes(item.name,$('faculty-query').value) && (!$('faculty-type').value || item.type === $('faculty-type').value));
    $('faculty-count').textContent = 'Підрозділів: '+entries.length;
    $('faculty-list').innerHTML = entries.length ? entries.map(item=>`<article class="card"><span class="pill ${item.type==='institute'?'institute':''}">${item.type==='institute'?'Навчально-науковий інститут':'Факультет'}</span><h3>${esc(item.name)}</h3><button type="button" class="open-records" data-faculty="${esc(item.id)}">Переглянути ОНП →</button></article>`).join('') : empty('Нічого не знайдено','Спробуйте іншу назву або скиньте фільтри.','building');
  }
  document.addEventListener('click', event => {
    const faculty = event.target.closest('[data-faculty]'),department = event.target.closest('[data-department]'),program = event.target.closest('[data-program]');
    if (faculty) {
      rememberOrigin('[data-faculty="'+faculty.dataset.faculty+'"]');
      $('program-query').value='';$('program-faculty').value=faculty.dataset.faculty;setView('programs');
    }
    if (program) {
      rememberOrigin('[data-program="'+program.dataset.program+'"]');
      $('discipline-query').value='';$('discipline-faculty').value=programById.get(program.dataset.program)?.facultyId || '';
      $('discipline-program').value='';$('discipline-department').value='';$('discipline-semester').value='';$('discipline-type').value='';
      setView('disciplines');$('discipline-program').value=program.dataset.program;renderDisciplines();
    }
    if (department) {
      rememberOrigin('[data-department="'+department.dataset.department+'"]');
      $('discipline-query').value='';$('discipline-program').value='';$('discipline-semester').value='';$('discipline-type').value='';$('discipline-faculty').value='';$('discipline-department').value='';setView('disciplines');$('discipline-department').value=department.dataset.department;renderDisciplines();
    }
  });
  document.querySelectorAll('.filters').forEach(form => {
    form.addEventListener('submit',event=>event.preventDefault());
    form.addEventListener('input',event=>{if(event.target.tagName === 'INPUT') render();});
    form.addEventListener('change',event=>{if(event.target.tagName === 'SELECT') render();});
    form.addEventListener('reset',()=>setTimeout(render,0));
  });
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
  $('install-app').onclick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;
    } else $('install-help').showModal();
  };
  const hideInstall = () => {$('install-app').hidden=true;};
  window.addEventListener('appinstalled',hideInstall);
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) hideInstall();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    const controlled = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if (controlled && !reloading) {reloading=true;location.reload();}
    });
    window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{}));
  }
  setView('overview',false);
})();












