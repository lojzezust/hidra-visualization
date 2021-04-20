
function get_dates(){
  return fetch('https://gea.arso.gov.si/vg2020-dev/hidra/listHIDRAjson')
  .then(response => response.json())
  .then(data => Promise.resolve(data.Dates));
}

function get_run(date){
  return fetch('https://gea.arso.gov.si/vg2020-dev/hidra/showHIDRAjson?date='+date)
  .then(response => response.json());
}

function parse_date(date){
  return moment(date, "DD.MM.YYYY hh:mm").format();
}


get_dates()
.then(dates => get_run(dates[0]))
.then(data => {
  console.log(data);

  let dates = data.Dates.map(val => parse_date(val));
  let values = data.Hidra[0].values;
  let plot = document.getElementById('plot');

  let ssh_dates = data.Koper.Dates.map(val => parse_date(val));
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
})