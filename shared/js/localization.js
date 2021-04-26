
var localization = function(){
    let values = {
        "HIDRA napoved": {
            'sl': "HIDRA napoved",
            'en': "HIDRA forecast"
        },
        "Izmerjena višina": {
            'sl': "Izmerjena višina",
            'en': "Measured sea-level"
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
