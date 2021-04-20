
var app = {};

function getDates(){
  return fetch('https://gea.arso.gov.si/vg2020-dev/hidra/listHIDRAjson')
  .then(response => response.json())
  .then(data => Promise.resolve(data.Dates));
}

function getRun(date){
  return fetch('https://gea.arso.gov.si/vg2020-dev/hidra/showHIDRAjson?date='+date)
  .then(response => response.json());
}

function parseDate(date){
  return moment(date, "DD.MM.YYYY hh:mm").format();
}

function selectDate(e){
  updatePlot(app.run_select.value);
}

function initPlot(){
  let pred = app.data.predictions[app.data.predictions.length - 1];
  let start_date = moment(pred.x[0]).subtract(24, 'hours').format();
  let pred_start = pred.x[0];
  let end_date = pred.x[pred.x.length - 1];
  app.home_range = [start_date, end_date];

  let data = [{
    x: pred.x,
    y: pred.y,
    name: "HIDRA napoved"
  },
  {
    x:app.data.ssh.x,
    y:app.data.ssh.y,
    name: "Izmerjena višina"
  }];

  let layout = {
    xaxis: {range: [start_date, end_date]},
    shapes: [
      {
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: start_date,
          y0: 0,
          x1: pred_start,
          y1: 1,
          fillcolor: '#d3d3d3',
          opacity: 0.2,
          line: {
              width: 0
          }
      }]
  };

  Plotly.newPlot(app.plot, data, layout);
}

function fetchData(){
  return getDates()
  .then(dates => {
    dates.sort();
    app.dates = dates;
    let promises = dates.map(date => getRun(date));
    return Promise.all(promises);
  })
  .then(data => {
    let ssh = [];
    let ssh_dates = [];
    let predictions = [];

    for(d of data){
      ssh.push(...d.Koper.values);
      ssh_dates.push(...d.Koper.Dates.map(val => parseDate(val)));

      let last_v = ssh[ssh.length - 1];
      let last_d = ssh_dates[ssh_dates.length - 1];

      let pred = {
        date: d.ForecastDate,
        x: [last_d, ...d.Dates.map(val => parseDate(val))],
        y: [last_v, ...d.Hidra[42].values]
      };

      predictions.push(pred);

    }

    app.data = {
      ssh: {
        x: ssh_dates,
        y: ssh
      },
      predictions: predictions
    };

    return Promise.resolve();
  });
}

function updatePlot(index){
  let dates = app.data.predictions[index].x;
  let values = app.data.predictions[index].y;
  let start_date = moment(dates[0]).subtract(24, 'hours').format();
  let pred_start = dates[0];
  let end_date = dates[dates.length - 1]
  app.home_range = [start_date, end_date];

  Plotly.animate(app.plot, {
    data: [{
      x: dates,
      y: values
    }],
    layout: {
      xaxis: {range: app.home_range},
      shapes: [
        {
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: start_date,
            y0: 0,
            x1: pred_start,
            y1: 1,
            fillcolor: '#d3d3d3',
            opacity: 0.2,
            line: {
                width: 0
            }
        }]
    }
  }, {
    transition: {
      duration: 500,
      easing: 'cubic-in-out'
    }
  });
  app.plot._fullLayout.xaxis._rangeInitial = app.home_range;
}


window.onload = function(){
  // Store elements
  app.plot = document.getElementById('plot');
  app.run_select = document.getElementById('run_select');

  app.run_select.addEventListener("change", selectDate);

  // Populate date selection
  fetchData()
  .then(() => {
    app.data.predictions.forEach((val, i) => {
      let opt = document.createElement("option");
      opt.value = i;
      opt.innerHTML = val.date;
      app.run_select.appendChild(opt);
    });
    
    // Display the most recent run
    let last_i = app.data.predictions.length - 1;
    app.run_select.value = last_i;
    initPlot(last_i);
  });
}