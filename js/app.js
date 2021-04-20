
window.onload = function(){
  // Store elements
  var plot = document.getElementById('plot');
  var run_select = document.getElementById('run_select');

  run_select.addEventListener("change", selectDate);

  // Populate date selection
  getDates()
  .then(dates => {
    dates.sort();
    for(date of dates) {
      let opt = document.createElement("option");
      opt.value = date;
      opt.innerHTML = date;
      run_select.appendChild(opt);
    }
    
    // Display the most recent run
    let last_date = dates[dates.length - 1];
    run_select.value = last_date;
    displayPlot(last_date);
  });
}

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
  displayPlot(run_select.value);
}

function displayPlot(date){
  getRun(date)
  .then(data => {
    console.log(data);

    let dates = data.Dates.map(val => parseDate(val));
    let values = data.Hidra[42].values;

    let ssh_dates = data.Koper.Dates.map(val => parseDate(val));
    let ssh_values = data.Koper.values;

    Plotly.newPlot(plot, [
      {
        x: dates,
        y: values,
        name: "HIDRA napoved"
      },
      {
        x:ssh_dates,
        y:ssh_values,
        name: "Izmerjena višina"
      }], { } );
  });
}