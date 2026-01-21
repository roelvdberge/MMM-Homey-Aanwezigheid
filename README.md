# MMM-Homey-Aanwezigheid

MagicMirror module to show presence states from Homey Logic variables.

## Features
- Configurable people/cats list
- Per-person icon
- Green/gray state based on Logic `Ja/Nee` values
- Local Homey API polling

## Install

```bash
cd MagicMirror/modules
# if you cloned elsewhere, move it here
```

## Configuration

Add to `MagicMirror/config/config.js`:

```js
{
  module: "MMM-Homey-Aanwezigheid",
  position: "top_left",
  config: {
    homeyBaseUrl: "http://192.168.1.88",
    apiKey: "YOUR_API_KEY",
    pollInterval: 30000,
    presentColor: "#2ecc71",
    absentColor: "#8e8e8e",
    showLabels: true,
    labelPosition: "below",
    people: [
      { name: "Femke", variable: "Femke Binnen", icon: "fa-solid fa-user" },
      { name: "Anna", variable: "Anna Binnen", icon: "fa-solid fa-user" },
      { name: "Simon", variable: "Simon Binnen", icon: "fa-solid fa-user" },
      { name: "Lily", variable: "Lily Binnen", icon: "fa-solid fa-cat" },
      { name: "Lucy", variable: "Lucy Binnen", icon: "fa-solid fa-cat" }
    ]
  }
}
```

## Notes
- Uses Homey local API: `GET /api/manager/logic/variable`
- Logic variables should be boolean or string `Ja/Nee`
