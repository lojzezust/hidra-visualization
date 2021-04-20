

fetch('https://gea.arso.gov.si/vg2020-dev/hidra/listHIDRAjson')
.then(response => response.json())
.then(data => fetch('https://gea.arso.gov.si/vg2020-dev/hidra/showHIDRAjson?date='+data.Dates[0]))
.then(response => response.json())
.then(data => {
  let values = data.Hidra[0].values;
  let plot = document.getElementById('plot');

	Plotly.newPlot(plot, [{
    x: [...Array(values.length).keys()],
    y: values }], { } );
});
