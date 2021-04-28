
var localization = function(){
    let values = {
        "HIDRA napoved": {
            'sl': "HIDRA napoved (±2σ)",
            'en': "HIDRA forecast (±2σ)"
        },
        "Izmerjena višina": {
            'sl': "Izmerjena višina",
            'en': "Sea-level measurement"
        },
        "Višina [cm]": {
            'sl': "Višina morske gladine [cm]",
            'en': "Sea-level [cm]"
        },
        "Datum napovedi: ": {
            'sl': "Datum napovedi: ",
            'en': "Forecast date: "
        }
    };

    return {
        localize: function(key, lang){
            return values[key][lang] || key;
        }
    }
}();
