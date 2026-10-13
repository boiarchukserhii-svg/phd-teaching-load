(() => {
  'use strict';
  const data = window.TEACHING_DATA || {faculties:[],departments:[],disciplines:[]};
  const faculties = data.faculties || [], departments = data.departments || [], disciplines = data.disciplines || [];
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalize = value => String(value || '').normalize('NFC').toLocaleLowerCase('uk-UA').replace(/[’ʼ']/g,'').trim();
  const includes = (value, query) => normalize(query).split(/\s+/).filter(Boolean).every(word => normalize(value).includes(word));
  const facultyById = new Map(faculties.map(item => [item.id,item]));
  const departmentById = new Map(departments.map(item => [item.id,item]));
  const facultyName = id => facultyById.get(id)?.name || 'Підрозділ не зазначено';
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3Z"/>',
    book:'<path d="M12 5v16M3 4c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 2-3-3-6-3-9-2Z"/>',
    layers:'<path d="m3 7 9-4 9 4-9 4ZM3 12l9 4 9-4M3 17l9 4 9-4"/>',
    building:'<path d="M3 21h18M5 21V8h14v13M3 8l9-5 9 5M9 12v2m6-2v2M10 21v-4h4v4"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
  };
  const icon = key => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key] || icons.book}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(node => {node.innerHTML = icon(node.dataset.icon);});
  let view = 'overview';
  function setView(name, moveFocus = true) {
    if (!['overview','disciplines','departments','faculties'].includes(name)) name = 'overview';
    view = name;
    document.querySelectorAll('.view').forEach(section => {section.hidden = section.id !== 'view-'+view;});
    document.querySelectorAll('.bottom-nav [data-view]').forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle('current',active);button.setAttribute('aria-current',active?'page':'false');
    });
    render();
    if (moveFocus) {
      const heading = $('view-'+view).querySelector('h2');
      heading.focus({preventScroll:true});
      heading.scrollIntoView({block:'start',behavior:'instant'});
    }
  }
  document.querySelectorAll('[data-view]').forEach(button => {button.onclick = () => setView(button.dataset.view);});
  const facultyOptions = '<option value="">Усі підрозділи</option>'+faculties.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');
  $('discipline-faculty').innerHTML = facultyOptions;
  $('department-faculty').innerHTML = facultyOptions;
  $('discipline-total').textContent = disciplines.length;
  $('department-total').textContent = departments.length;
  $('faculty-total').textContent = faculties.length;
  if (disciplines.length || departments.length) $('data-status').textContent = data.academicYear ? 'Навчальний рік: '+data.academicYear : 'Навчальний рік не зазначено';
  function empty(title, message, symbol = 'book') {
    return `<div class="empty"><span>${icon(symbol)}</span><h3>${esc(title)}</h3><p>${esc(message)}</p></div>`;
  }
  function render() {
    if (view === 'disciplines') renderDisciplines();
    if (view === 'departments') renderDepartments();
    if (view === 'faculties') renderFaculties();
  }
  function renderDisciplines() {
    const selected = $('discipline-department').value;
    const available = departments.filter(item=>!$('discipline-faculty').value || item.facultyId === $('discipline-faculty').value);
    $('discipline-department').innerHTML = '<option value="">Усі кафедри</option>'+available.map(item=>`<option value="${esc(item.id)}">${esc(item.code?item.code+' · ':'')}${esc(item.name)}</option>`).join('');
    if (available.some(item=>item.id===selected)) $('discipline-department').value = selected;
    const entries = disciplines.filter(item=>includes([item.name,departmentById.get(item.departmentId)?.code,facultyName(item.facultyId)].join(' '),$('discipline-query').value) &&
      (!$('discipline-faculty').value || item.facultyId === $('discipline-faculty').value) &&
      (!$('discipline-department').value || item.departmentId === $('discipline-department').value));
    $('discipline-count').textContent = 'Записів: '+entries.length;
    $('discipline-list').innerHTML = entries.length ? entries.map(item=>`<article class="card"><span class="pill">Дисципліна</span><h3>${esc(item.name)}</h3><p>${esc(facultyName(item.facultyId))}</p><p>Кафедра: ${esc(departmentById.get(item.departmentId)?.name || 'Не зазначено')}</p></article>`).join('') :
      disciplines.length ? empty('Нічого не знайдено','Спробуйте змінити пошук або скинути фільтри.') :
        empty('Дисципліни ще не додано',$('discipline-faculty').value?facultyName($('discipline-faculty').value):'Тут відображатимуться дисципліни за факультетами та кафедрами.');
  }
  function renderDepartments() {
    const entries = departments.filter(item=>includes([item.name,item.code].join(' '),$('department-query').value) && (!$('department-faculty').value || item.facultyId === $('department-faculty').value));
    $('department-count').textContent = 'Кафедр: '+entries.length;
    $('department-list').innerHTML = entries.length ? entries.map(item=>`<article class="card"><span class="pill">${esc(item.code || 'Кафедра')}</span><h3>${esc(item.name)}</h3><p>${esc(facultyName(item.facultyId))}</p><button type="button" class="open-records" data-department="${esc(item.id)}">Переглянути дисципліни →</button></article>`).join('') :
      departments.length ? empty('Нічого не знайдено','Спробуйте змінити пошук або скинути фільтри.','layers') : empty('Кафедри ще не додано','Тут відображатиметься перелік кафедр та їхніх дисциплін.','layers');
  }
  function renderFaculties() {
    const entries = faculties.filter(item=>includes(item.name,$('faculty-query').value) && (!$('faculty-type').value || item.type === $('faculty-type').value));
    $('faculty-count').textContent = 'Підрозділів: '+entries.length;
    $('faculty-list').innerHTML = entries.length ? entries.map(item=>`<article class="card"><span class="pill ${item.type==='institute'?'institute':''}">${item.type==='institute'?'Навчально-науковий інститут':'Факультет'}</span><h3>${esc(item.name)}</h3><button type="button" class="open-records" data-faculty="${esc(item.id)}">Переглянути дисципліни →</button></article>`).join('') : empty('Нічого не знайдено','Спробуйте іншу назву або скиньте фільтри.','building');
  }
  document.addEventListener('click', event => {
    const faculty = event.target.closest('[data-faculty]'),department = event.target.closest('[data-department]');
    if (faculty) {
      $('discipline-query').value='';$('discipline-faculty').value=faculty.dataset.faculty;$('discipline-department').value='';setView('disciplines');
    }
    if (department) {
      $('discipline-query').value='';$('discipline-faculty').value=departmentById.get(department.dataset.department)?.facultyId || '';setView('disciplines');$('discipline-department').value=department.dataset.department;renderDisciplines();
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
