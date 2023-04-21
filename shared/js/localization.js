
var localization = function(){
    let values = {
        "HIDRA2 napoved": {
            'sl': "HIDRA2 napoved (±3σ)",
            'en': "HIDRA2 forecast (±3σ)"
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
