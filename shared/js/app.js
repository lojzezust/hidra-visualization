
var app = {
  critical: {red: 350, orange:330, yellow:300}
};

// Fetch dates from server
function getDates(){
  return fetch('https://gea.arso.gov.si/vg2020-dev/hidra/listHIDRAjson')
    .then(response => response.json())
    .then(data => Promise.resolve(data.Dates));
}

// Fetch a single run from server
function getRun(date){
  return fetch('https://gea.arso.gov.si/vg2020-dev/hidra/showHIDRAjson?date='+date)
    .then(response => response.json());
}

function getSSH(){
  return fetch('https://gea.arso.gov.si/vg2020-dev/hidra/showKPjson')
    .then(response => response.json());
}

function parseDate(date){
  return moment(date, "DD.MM.YYYY hh:mm").format();
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

// Called when different run is selected
function selectDate(e){
  let frame = app.frames.find((f) => f.name == e.step.value);

  Plotly.animate(app.plot, [frame.data_frame], {
    mode: 'immediate',
    frame: {duration: 0, redraw: false},
  }).then(()=>{
    app.plot._fullLayout.xaxis._rangeInitial = frame.date_range;

    // autoscale
    Plotly.relayout(app.plot, {yaxis: {autorange:true}});

    return Plotly.animate(app.plot, [frame.animation_frame], {
      mode: 'immediate',
      transition: {duration: 500, easing:'exp-out'},
      frame: {duration: 500, redraw: false},
    })
  }).then(()=>{
    
  });
}

// Loads data from server into the app
function fetchData(){
  
  let runs = getDates()
  .then(dates => {
    dates.sort();
    app.dates = dates;
    let promises = dates.map(date => getRun(date));
    return Promise.all(promises);
  });

  let ssh = getSSH();

  return Promise.all([runs, ssh])
  .then(data => {
    let runs_data = data[0];
    let ssh_data = data[1];

    let ssh = ssh_data.Values;
    let ssh_dates = ssh_data.Dates.map(val => parseDate(val));
    
    let predictions = [];
    for(d of runs_data){

      // Moment matching
      let ens_mu = d.Hidra[0].values.map((_, colIndex) => d.Hidra.map(row => row.values[colIndex]));
      let ens_std = d.Hidra[0].stds.map((_, colIndex) => d.Hidra.map(row => row.stds[colIndex]));

      let means = ens_mu.map(vals => average(vals));
      let stddevs = ens_mu.map((mu_vals, i) => {
        let std_vals = ens_std[i];
        let L = average(mu_vals.map((mu_j, j) => mu_j*mu_j + std_vals[j]*std_vals[j]));
        let mu_m = average(mu_vals)
        let R = mu_m * mu_m;

        return Math.sqrt(L - R)
      });

      let pred = {
        date: d.ForecastDate,
        x: d.Dates.map(val => parseDate(val)),
        y: means,
        stddev: stddevs,
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

// Loads the plot
function initPlot(){

  // FRAMES
  app.frames = app.data.predictions.map((pred,i) => {
    let start_date = moment(pred.x[0]).subtract(24, 'hours').format();
    let pred_start = pred.x[0];
    let end_date = pred.x[pred.x.length - 1];
  
    let yMax = pred.y.map((y,i) => y+2*pred.stddev[i]);
    let yMin = pred.y.map((y,i) => y-2*pred.stddev[i]);

    return {
      name: pred.date,
      date_range: [start_date, end_date],
      data_frame: {
        data: [{
          x: pred.x,
          y: pred.y
        },{
          x: pred.x.concat([...pred.x].reverse()),
          y: yMax.concat([...yMin].reverse()),
        }],
        layout: {
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
      },
      animation_frame: {
        layout: {xaxis: {range: [start_date, end_date]} }
      }
    };
  });

  // SLIDER
  let slider_vals = app.data.predictions.map((pred,i) => {
    return {
      label: pred.date,
      method: 'skip'
    };
  });
  let last_i = slider_vals.length - 1;

  // DATA
  let pred = app.data.predictions[app.data.predictions.length - 1];
  let start_date = moment(pred.x[0]).subtract(24, 'hours').format();
  let pred_start = pred.x[0];
  let end_date = pred.x[pred.x.length - 1];

  let yMax = pred.y.map((y,i) => y+2*pred.stddev[i]);
  let yMin = pred.y.map((y,i) => y-2*pred.stddev[i]);

  let data = [{
    x: pred.x,
    y: pred.y,
    name: app.localization.localize("HIDRA napoved", app.lang),
    legendgroup:'predictions'
  },
  {
    x: pred.x.concat([...pred.x].reverse()),
    y: yMax.concat([...yMin].reverse()),
    legendgroup:'predictions',
    hoverinfo: 'none',
    showlegend:false,
    line: {width:0, color: '#1f77b4'},
    fill:'toself'
  },
  {
    x:app.data.ssh.x,
    y:app.data.ssh.y,
    name: app.localization.localize("Izmerjena višina", app.lang)
  }];

  // LAYOUT
  let layout = {
    margin: {t: 40},
    xaxis: {range: [start_date, end_date]},
    yaxis: {fixedrange: true, title: {text: app.localization.localize("Višina [cm]", app.lang)}},
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
        prefix: app.localization.localize("Datum napovedi: ", app.lang),
        font: {
          color: '#888',
          size: 20
        }
      },
      steps: slider_vals
    }]
  };

  Plotly.newPlot(app.plot, {
    data:data, 
    layout:layout,
    config: {responsive: true, locale: app.lang}
  }).then(()=>{
    app.placeholder.parentNode.removeChild(app.placeholder);
  });

  app.plot.on('plotly_sliderchange', selectDate);
}

// When ready, load data and display plot
window.onload = function(){
  app.localization = localization;
  app.lang = document.getElementById('app-script').getAttribute('data-lang')
  app.plot = document.getElementById('plot');
  app.placeholder = document.getElementById('plot-placeholder');

  // Populate date selection
  fetchData()
  .then(() => initPlot());
}
