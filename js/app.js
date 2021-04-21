
var app = {
  critical: {red: 350, orange:330, yellow:300}
};

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
  updatePlot(e.step._index);
}

function initPlot(){
  let pred = app.data.predictions[app.data.predictions.length - 1];
  let start_date = moment(pred.x[0]).subtract(23, 'hours').format();
  let pred_start = pred.x[0];
  let end_date = pred.x[pred.x.length - 1];
  app.home_range = [start_date, end_date];

  let yMax = pred.y.map((y,i) => y+2*pred.stddev[i]);
  let yMin = pred.y.map((y,i) => y-2*pred.stddev[i]);

  let data = [{
    x: pred.x,
    y: pred.y,
    name: "HIDRA napoved",
    legendgroup:'predictions'
  },
  {
    x: pred.x.concat([...pred.x].reverse()),
    y: yMax.concat([...yMin].reverse()),
    legendgroup:'predictions',
    showlegend:false,
    line: {width:0, color: '#1f77b4'},
    fill:'toself'
  },
  {
    x:app.data.ssh.x,
    y:app.data.ssh.y,
    name: "Izmerjena višina"
  }];

  let slider_vals = app.data.predictions.map((pred,i) => {
    return {
      label: pred.date,
      method: 'skip'
    };
  });
  let last_i = slider_vals.length - 1;

  let layout = {
    margin: {t: 40},
    xaxis: {range: [start_date, end_date]},
    yaxis: {fixedrange: true},
    dragmode: 'pan',
    shapes: [{
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
    },{
      type: 'line',
      x0: 0,
      x1: 1,
      y0: app.critical.red,
      y1: app.critical.red,
      xref: 'paper',
      line: {
        color: 'red',
        width: 1.5,
        dash: 'dot'
      }
    },{
      type: 'line',
      x0: 0,
      x1: 1,
      y0: app.critical.orange,
      y1: app.critical.orange,
      xref: 'paper',
      line: {
        color: 'orange',
        width: 1.5,
        dash: 'dot'
      }
    },{
      type: 'line',
      x0: 0,
      x1: 1,
      y0: app.critical.yellow,
      y1: app.critical.yellow,
      xref: 'paper',
      line: {
        color: 'yellow',
        width: 1.5,
        dash: 'dot'
      }
    }],
    sliders: [{
      pad: {t: 70},
      active: last_i,
      currentvalue: {
        xanchor: 'right',
        prefix: 'Datum napovedi: ',
        font: {
          color: '#888',
          size: 20
        }
      },
      steps: slider_vals
    }]
  };

  Plotly.newPlot(app.plot, data, layout, {responsive: true});

  app.plot.on('plotly_sliderchange', selectDate);
}

function average(vals){
  let sum = vals.reduce((sum, v)=>sum+v);
  return sum/vals.length;
}

function stddev(vals){
  let m = average(vals);
  let sqDiffs = vals.map(v => (v-m)*(v-m));
  
  return Math.sqrt(average(sqDiffs));
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

      let ens = d.Hidra[0].values.map((_, colIndex) => d.Hidra.map(row => row.values[colIndex]));
      let means = ens.map(vals => average(vals));
      let stddevs = ens.map(vals => stddev(vals))

      let pred = {
        date: d.ForecastDate,
        x: [last_d, ...d.Dates.map(val => parseDate(val))],
        y: [last_v, ...means],
        stddev: [0, ...stddevs],
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
  let pred = app.data.predictions[index];
  let start_date = moment(pred.x[0]).subtract(23, 'hours').format();
  let pred_start = pred.x[0];
  let end_date = pred.x[pred.x.length - 1]
  app.home_range = [start_date, end_date];

  let yMax = pred.y.map((y,i) => y+2*pred.stddev[i]);
  let yMin = pred.y.map((y,i) => y-2*pred.stddev[i]);

  Plotly.animate(app.plot, {
    data: [{
      x: pred.x,
      y: pred.y
    },{
      x: pred.x.concat([...pred.x].reverse()),
      y: yMax.concat([...yMin].reverse()),
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

  // Populate date selection
  fetchData()
  .then(() => initPlot());
}
