(function() {
  'use strict';

  const calendarEl = document.getElementById('calendar');
  const monthLabel = document.getElementById('monthLabel');
  const prevMonthButton = document.getElementById('prev-month-button');
  const nextMonthButton = document.getElementById('next-month-button');

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-based
  let events = [];
  let fields = [];
  let labels = [];
  const SOURCE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-ZZ5igNAgYF2aDKkvNqmY1ia5yv2RMDymvD3qvAJzzVPU5oVoFepzDHva8y6BJWPlkrbrJNKmPlK8/pub?gid=1419688078&single=true&output=csv';

  prevMonthButton.onclick = (e) => { changeMonth(-1) };
  nextMonthButton.onclick = (e) => { changeMonth(1) };

  function renderCalendar() {
    calendarEl.innerHTML = '';
    const daysOfWeek = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
    daysOfWeek.forEach(day => {
      const header = document.createElement('div');
      header.textContent = day;
      header.className = 'header';
      calendarEl.appendChild(header);
    });

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    monthLabel.textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${currentYear}`;

    const prePad = (startDay === 0) ? 6 : startDay - 1;
    for (let i = 0; i < prePad; i++) {
      calendarEl.appendChild(document.createElement('div'));
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const cellDate = new Date(currentYear, currentMonth, d);
      const cell = document.createElement('div');
      cell.className = 'day';

      // 新增日期標題區塊
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';
      const dayNumber = document.createElement('strong');
      dayNumber.textContent = d;
      const dayName = document.createElement('span');
      dayName.textContent = daysOfWeek[cellDate.getDay() === 0 ? 6 : cellDate.getDay() - 1];
      dayHeader.appendChild(dayNumber);
      dayHeader.appendChild(dayName);
      cell.appendChild(dayHeader);

      // 新增內容區塊
      const dayContent = document.createElement('div');
      dayContent.className = 'day-content';
      cell.appendChild(dayContent);

      events.forEach(event => {
        const startList = event.start.split('-');
        const endList = event.end.split('-');
        if (startList.length == 3 && endList.length == 3) {
          const start = new Date(startList[0], startList[1]-1, startList[2]);
          const end = new Date(endList[0], endList[1]-1, endList[2]);
          if (cellDate >= start && cellDate <= end) {
            const ev = document.createElement('div');
            ev.className = 'event';
            ev.textContent = `${event.group}::${event.title}`;
            const hue = (event.group) ? stringToHue(event.group) : Math.random() * 360;
            ev.style.background = `hsl(${hue} 80% 80% / 50%)`;
            ev.style.borderLeftColor = `hsl(${hue} 80% 40% / 60%)`;
            ev.onclick = (e) => { handleClickDetail(e, event) };
            dayContent.appendChild(ev);
          }
        } else {
          console.error(`error date format: ${event.start}/${event.end}`);
        }
      });

      calendarEl.appendChild(cell);
    }
  }

  function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (insideQuotes) {
        if (char === '"' && nextChar === '"') {
          value += '"'; // Escaped quote
          i++;
        } else if (char === '"') {
          insideQuotes = false;
        } else {
          value += char;
        }
      } else {
        if (char === '"') {
          insideQuotes = true;
        } else if (char === ',') {
          row.push(value);
          value = '';
        } else if (char === '\n') {
          row.push(value);
          rows.push(row);
          row = [];
          value = '';
        } else if (char === '\r') {
          // ignore \r (CRLF)
        } else {
          value += char;
        }
      }
    }

    // Push the last value
    if (value || row.length > 0) {
      row.push(value);
      rows.push(row);
    }

    // Convert to objects using the first row as header
    const [headerName, headerLabel, _, ...dataRows] = rows;
    // to global variables
    fields = headerName;
    labels = headerLabel;
    return dataRows.map(row =>
      Object.fromEntries(headerName.map((h, i) => [h, row[i] || '']))
    );
  }

  function stringToHue(str) {
    let hash = 0;

    // Create a numeric hash from the string
    for (let i = 0; i < str.length; i++) {
      // Multiply by 31 (common in hash functions) and add character code
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      // Convert to 32bit integer
      hash |= 0;
    }

    // Take absolute value (in case of negative hash)
    hash = Math.abs(hash);

    // Get a value between 0-360 using modulo
    return hash % 361;
  }

  function renderDetail(data) {
    let layout = new w2layout({
      name: 'layout',
      padding: 0,
      panels: [
        { type: 'left', size: 200, resizable: true, minSize: 120 },
        { type: 'main', minSize: 550, overflow: 'hidden' }
      ]
    });
    let grid2 = new w2grid({
      name: 'grid2',
      box: '#grid2',
      header: 'Details',
      show: { header: true, columnHeaders: false },
      columns: [
        { field: 'name', text: 'Name', size: '100px', style: 'background-color: #efefef; border-bottom: 1px solid white; padding-right: 5px;', attr: "align=right" },
        { field: 'value', text: 'Value', size: '100%', style: 'white-space: normal; height: auto;',
          render(record, extra) {
            let fieldIndex = labels.findIndex( x => x === record.name);
            if (fields[fieldIndex] === 'url' && record.value) {
              return `<a href="${record.value}" target="_blank" title="Go!">${record.value}</a>`;
            } else if (fields[fieldIndex] === 'source' && (record.value.indexOf('https://') >= 0) || record.value.indexOf('http://') >= 0) {
              return `<a href="${record.value}" target="_blank" title="Go!">${record.value}</a>`;
            }

            return extra.value;
          }
        }
      ]
    });

    const groupEvents = events.filter( x => x.group === data.group);
    const sidebarNodes = [];
    let currentGroupIndex = 0;
    groupEvents.forEach((x, i) => {
      if (data.title === x.title) {
        currentGroupIndex = i;
      }
      sidebarNodes.push({
        id: `id-${i}`,
        text: x.title
      });
    });
    //const sidebarNodes = groupEvents.map( (x, i) => ({id: `id-${i}`, text: x.title}));
    let sidebar = new w2sidebar({
      name: 'sidebar',
      nodes: [
        { id: 'group', text: data.group, group: true, expanded: true, nodes: sidebarNodes}
      ],
      onClick(event) {
        const clickedId = event.target.substring(3);
        const d = groupEvents[clickedId];
        const contentList = fields.map( (x, i) => {
          return {
            recid: i,
            name: labels[i],
            value: d[x],
          };
        });
        grid2.clear();
        grid2.add(contentList);
      }
    });

    layout.render('#main');
    layout.html('left', sidebar);
    w2ui.sidebar.select(`id-${currentGroupIndex}`);
    grid2.clear();
    fields.forEach( (x, i) => {
      grid2.add({
        recid: i,
        name: labels[i],
        value: data[x],
      });
    });

    layout.html('main', grid2);
  }

  function handleClickDetail(e, data) {
    //const title = (data.group === data.title) ? data.title : `${data.group} :: ${data.title}`;
    w2popup.open({
      title: data.title,
      width: 800,
      height: 600,
      showMax: true,
      body: `<div id="main" style="width: 100%; height: 500px;"></div>`,
      actions: {
        Ok(event) {
          w2popup.close();
        },
      }
    })
      .close(e => {
        w2ui.layout.destroy();
        w2ui.sidebar.destroy();
        w2ui.grid2.destroy();
    })
      .then(e => {
        renderDetail(data);
      }); // end of popup

  } // end of handleClickDetail

  // init, load csv
  fetch(SOURCE_URL)
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.text(); // CSV is plain text
    })
    .then(csvText => {
      events = parseCSV(csvText);
      console.log(events);
      renderCalendar();
    })
    .catch(error => {
      alert(error);
      console.error('Fetch error:', error);
    });

})();
