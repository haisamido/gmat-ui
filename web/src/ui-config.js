/**
 * ui-config.js — Generated from ui-definition.yaml
 * Source: deployments/web/src/ui-definition.yaml
 * DO NOT EDIT — run: task web:ui:generate
 */

export const UI_CONFIG = {
  "meta": {},
  "menuBar": {
    "items": [
      {
        "label": "File",
        "items": [
          {
            "id": "menu-new-script",
            "label": "New Script",
            "shortcut": "Ctrl+Shift+N",
            "action": "newScript"
          },
          {
            "id": "menu-new-mission",
            "label": "New Mission",
            "shortcut": "Ctrl+N",
            "action": "newMission"
          },
          {
            "separator": true
          },
          {
            "id": "menu-open-script",
            "label": "Open...",
            "shortcut": "Ctrl+O",
            "action": "openScript"
          },
          {
            "separator": true
          },
          {
            "id": "menu-save-script",
            "label": "Save Script",
            "shortcut": "Ctrl+S",
            "action": "saveScript"
          },
          {
            "id": "menu-save-script-as",
            "label": "Save Script As...",
            "shortcut": "F12",
            "action": "saveScriptAs"
          }
        ]
      },
      {
        "label": "Edit",
        "items": [
          {
            "id": "menu-undo",
            "label": "Undo",
            "shortcut": "Ctrl+Z",
            "action": "undo"
          },
          {
            "id": "menu-redo",
            "label": "Redo",
            "shortcut": "Ctrl+Y",
            "action": "redo"
          },
          {
            "separator": true
          },
          {
            "id": "menu-cut",
            "label": "Cut",
            "shortcut": "Ctrl+X",
            "action": "cut"
          },
          {
            "id": "menu-copy",
            "label": "Copy",
            "shortcut": "Ctrl+C",
            "action": "copy"
          },
          {
            "id": "menu-paste",
            "label": "Paste",
            "shortcut": "Ctrl+V",
            "action": "paste"
          },
          {
            "separator": true
          },
          {
            "id": "menu-select-all",
            "label": "Select All",
            "shortcut": "Ctrl+A",
            "action": "selectAll"
          },
          {
            "separator": true
          },
          {
            "id": "menu-find",
            "label": "Find & Replace...",
            "shortcut": "Ctrl+F",
            "action": "find"
          },
          {
            "id": "menu-find-next",
            "label": "Find Next",
            "shortcut": "F3",
            "action": "findNext"
          },
          {
            "separator": true
          },
          {
            "id": "menu-comment",
            "label": "Comment",
            "shortcut": "Ctrl+/",
            "action": "comment"
          },
          {
            "id": "menu-uncomment",
            "label": "Uncomment",
            "shortcut": "Ctrl+Shift+/",
            "action": "uncomment"
          },
          {
            "separator": true
          },
          {
            "id": "menu-goto-line",
            "label": "Go to Line...",
            "shortcut": "Ctrl+L",
            "action": "gotoLine"
          },
          {
            "id": "menu-indent-more",
            "label": "Indent More",
            "shortcut": "Ctrl+]",
            "action": "indentMore"
          },
          {
            "id": "menu-indent-less",
            "label": "Indent Less",
            "shortcut": "Ctrl+[",
            "action": "indentLess"
          }
        ]
      },
      {
        "label": "Run",
        "items": [
          {
            "id": "menu-run",
            "label": "Run Script",
            "shortcut": "F5",
            "action": "runMission"
          },
          {
            "id": "menu-stop",
            "label": "Stop",
            "shortcut": "Shift+F5",
            "action": "stopMission"
          },
          {
            "separator": true
          },
          {
            "id": "menu-generate",
            "label": "Generate Script",
            "shortcut": "Ctrl+G",
            "action": "generateScript"
          }
        ]
      },
      {
        "label": "Window",
        "items": [
          {
            "id": "menu-close-tab",
            "label": "Close Current Tab",
            "shortcut": "Ctrl+W",
            "action": "closeCurrentTab"
          },
          {
            "id": "menu-close-all",
            "label": "Close All Tabs",
            "action": "closeAllTabs"
          }
        ]
      },
      {
        "label": "Help",
        "items": [
          {
            "id": "menu-welcome",
            "label": "Welcome Page",
            "shortcut": "Ctrl+F1",
            "action": "showWelcome"
          },
          {
            "separator": true
          },
          {
            "id": "menu-help-contents",
            "label": "User Guide",
            "shortcut": "F1",
            "action": "openUserGuide"
          },
          {
            "id": "menu-help-tutorials",
            "label": "Tutorials",
            "action": "openTutorials"
          },
          {
            "separator": true
          },
          {
            "id": "menu-help-report",
            "label": "Report an Issue",
            "action": "reportIssue"
          },
          {
            "separator": true
          },
          {
            "id": "menu-help-docs",
            "label": "GMAT Documentation",
            "action": "openDocs"
          },
          {
            "id": "menu-help-console",
            "label": "Simple Console",
            "action": "openSimpleConsole"
          },
          {
            "id": "menu-help-earth",
            "label": "Earth Viewer",
            "action": "openEarthViewer"
          },
          {
            "separator": true
          },
          {
            "id": "menu-about",
            "label": "About GMAT Web GUI",
            "action": "showAbout"
          }
        ]
      }
    ]
  },
  "toolbar": {
    "items": [
      {
        "id": "btn-new-mission",
        "label": "New Mission",
        "title": "New Mission (Ctrl+N)",
        "action": "newMission"
      },
      {
        "id": "btn-open",
        "label": "Open",
        "title": "Open Script (Ctrl+O)",
        "action": "openScript"
      },
      {
        "id": "btn-save",
        "label": "Save",
        "title": "Save Script (Ctrl+S)",
        "action": "saveScript"
      },
      {
        "separator": true
      },
      {
        "id": "btn-run",
        "label": "▶ Run",
        "title": "Run Script (F5)",
        "action": "runMission",
        "style": "primary",
        "disabled": true
      },
      {
        "id": "btn-stop",
        "label": "■ Stop",
        "title": "Stop (Shift+F5)",
        "action": "stopMission",
        "disabled": true
      },
      {
        "separator": true
      },
      {
        "id": "btn-generate",
        "label": "Generate Script",
        "title": "Generate Script (Ctrl+G)",
        "action": "generateScript"
      },
      {
        "separator": true
      },
      {
        "id": "btn-example",
        "label": "Load Sample",
        "action": "loadSample"
      },
      {
        "separator": true
      },
      {
        "id": "btn-close-all",
        "label": "Close All",
        "title": "Close All Tabs",
        "action": "closeAllTabs"
      },
      {
        "id": "status-indicator",
        "type": "status",
        "initialText": "Loading WASM...",
        "class": "loading"
      }
    ]
  },
  "layout": {
    "type": "split-panel",
    "direction": "horizontal",
    "children": [
      {
        "id": "left-panel",
        "width": "280px",
        "minWidth": "200px",
        "maxWidth": "500px",
        "resizable": true,
        "tabs": [
          {
            "id": "resources",
            "label": "Resources",
            "default": true
          },
          {
            "id": "mission",
            "label": "Mission"
          },
          {
            "id": "output",
            "label": "Output"
          }
        ]
      },
      {
        "id": "main-content",
        "flex": 1,
        "contains": [
          {
            "tabBar": true
          },
          {
            "tabContent": true
          }
        ]
      },
      {
        "id": "console-panel",
        "position": "bottom",
        "height": "200px",
        "minHeight": "100px",
        "resizable": true,
        "collapsible": true
      }
    ]
  },
  "panels": {
    "Spacecraft": {
      "controller": "SpacecraftPanel",
      "cppReference": "src/base/spacecraft/Spacecraft.cpp",
      "tabs": [
        {
          "label": "Orbit",
          "fields": [
            {
              "name": "DateFormat",
              "type": "select",
              "options": [
                "UTCGregorian",
                "TAIModJulian",
                "TTModJulian",
                "A1ModJulian",
                "UTCModJulian",
                "TDBModJulian"
              ],
              "default": "UTCGregorian"
            },
            {
              "name": "Epoch",
              "type": "datetime",
              "default": "01 Jan 2024 12:00:00.000"
            },
            {
              "name": "CoordinateSystem",
              "type": "select",
              "default": "EarthMJ2000Eq"
            },
            {
              "name": "DisplayStateType",
              "type": "select",
              "options": [
                "Cartesian",
                "Keplerian",
                "SphericalAZFPA",
                "SphericalRADEC",
                "Equinoctial",
                "ModifiedEquinoctial",
                "Delaunay",
                "Planetodetic",
                "OutgoingAsymptote",
                "IncomingAsymptote",
                "BrouwerMeanShort",
                "BrouwerMeanLong"
              ],
              "default": "Keplerian"
            },
            {
              "name": "SMA",
              "label": "Semi-major Axis",
              "type": "number",
              "unit": "km",
              "default": 7191.938817629013
            },
            {
              "name": "ECC",
              "label": "Eccentricity",
              "type": "number",
              "default": 0.02454974900598091
            },
            {
              "name": "INC",
              "label": "Inclination",
              "type": "number",
              "unit": "deg",
              "default": 12.85008005658097
            },
            {
              "name": "RAAN",
              "label": "Right Ascension of Ascending Node",
              "type": "number",
              "unit": "deg",
              "default": 306.6148021947984
            },
            {
              "name": "AOP",
              "label": "Argument of Periapsis",
              "type": "number",
              "unit": "deg",
              "default": 314.1905515359921
            },
            {
              "name": "TA",
              "label": "True Anomaly",
              "type": "number",
              "unit": "deg",
              "default": 99.88774933204886
            }
          ]
        },
        {
          "label": "Attitude",
          "fields": [
            {
              "name": "AttitudeModel",
              "type": "select",
              "options": [
                "CoordinateSystemFixed",
                "Spinner",
                "SpiceAttitude",
                "PrecessingSpinner",
                "NadirPointing",
                "ThreeAxisKinematic"
              ],
              "default": "CoordinateSystemFixed"
            },
            {
              "name": "AttitudeCoordinateSystem",
              "type": "select",
              "default": "EarthMJ2000Eq"
            },
            {
              "name": "AttitudeStateType",
              "type": "select",
              "options": [
                "EulerAngles",
                "Quaternion",
                "DirectionCosineMatrix"
              ],
              "default": "EulerAngles"
            },
            {
              "name": "EulerSequence",
              "type": "select",
              "options": [
                "123",
                "132",
                "213",
                "231",
                "312",
                "321"
              ],
              "default": "321"
            },
            {
              "name": "EulerAngle1",
              "type": "number",
              "unit": "deg",
              "default": 0
            },
            {
              "name": "EulerAngle2",
              "type": "number",
              "unit": "deg",
              "default": 0
            },
            {
              "name": "EulerAngle3",
              "type": "number",
              "unit": "deg",
              "default": 0
            }
          ]
        },
        {
          "label": "Ballistic/Mass",
          "fields": [
            {
              "name": "DryMass",
              "type": "number",
              "unit": "kg",
              "default": 850
            },
            {
              "name": "Cd",
              "label": "Coefficient of Drag",
              "type": "number",
              "default": 2.2
            },
            {
              "name": "Cr",
              "label": "Coefficient of Reflectivity",
              "type": "number",
              "default": 1.8
            },
            {
              "name": "DragArea",
              "type": "number",
              "unit": "m²",
              "default": 15
            },
            {
              "name": "SRPArea",
              "label": "SRP Area",
              "type": "number",
              "unit": "m²",
              "default": 1
            }
          ]
        },
        {
          "label": "Tanks",
          "fields": [
            {
              "name": "Tanks",
              "type": "multi-select",
              "objectType": [
                "ChemicalTank",
                "ElectricTank"
              ]
            }
          ]
        },
        {
          "label": "Thrusters",
          "fields": [
            {
              "name": "Thrusters",
              "type": "multi-select",
              "objectType": [
                "ChemicalThruster",
                "ElectricThruster"
              ]
            }
          ]
        },
        {
          "label": "Power System",
          "fields": [
            {
              "name": "PowerSystem",
              "type": "select",
              "objectType": [
                "SolarPowerSystem",
                "NuclearPowerSystem"
              ]
            }
          ]
        },
        {
          "label": "Visualization",
          "fields": [
            {
              "name": "ModelFile",
              "type": "text",
              "default": "aura.3ds"
            },
            {
              "name": "ModelScale",
              "type": "number",
              "default": 1
            },
            {
              "name": "OrbitColor",
              "type": "color",
              "default": "#ff0000"
            },
            {
              "name": "TargetColor",
              "type": "color",
              "default": "#008080"
            }
          ]
        }
      ]
    },
    "Formation": {
      "controller": "FormationSetupPanel",
      "fields": [
        {
          "name": "Add",
          "label": "Spacecraft Members",
          "type": "multi-select",
          "objectType": "Spacecraft"
        }
      ]
    },
    "ForceModel": {
      "controller": "PropagatorPanel",
      "cppReference": "src/base/forcemodel/ODEModel.cpp",
      "fields": [
        {
          "name": "CentralBody",
          "type": "select",
          "default": "Earth"
        },
        {
          "name": "PrimaryBodies",
          "type": "multi-select",
          "default": [
            "Earth"
          ]
        },
        {
          "name": "PointMasses",
          "type": "multi-select",
          "default": []
        },
        {
          "name": "SRP",
          "label": "Solar Radiation Pressure",
          "type": "select",
          "options": [
            "On",
            "Off"
          ],
          "default": "Off"
        },
        {
          "name": "RelativisticCorrection",
          "type": "select",
          "options": [
            "On",
            "Off"
          ],
          "default": "Off"
        },
        {
          "name": "GravityField.Earth.Degree",
          "type": "number",
          "default": 4
        },
        {
          "name": "GravityField.Earth.Order",
          "type": "number",
          "default": 4
        },
        {
          "name": "GravityField.Earth.PotentialFile",
          "type": "select",
          "options": [
            "JGM2.cof",
            "JGM3.cof",
            "EGM96.cof",
            "GGM02C.cof",
            "GGM03C.cof"
          ],
          "default": "JGM2.cof"
        }
      ]
    },
    "Propagator": {
      "controller": "PropagatorPanel",
      "cppReference": "src/base/propagator/Propagator.cpp",
      "fields": [
        {
          "name": "FM",
          "label": "Force Model",
          "type": "select",
          "objectType": "ForceModel"
        },
        {
          "name": "Type",
          "type": "select",
          "options": [
            "RungeKutta89",
            "RungeKutta68",
            "PrinceDormand45",
            "PrinceDormand78",
            "BulirschStoer",
            "AdamsBashforthMoulton"
          ],
          "default": "RungeKutta89"
        },
        {
          "name": "InitialStepSize",
          "type": "number",
          "unit": "sec",
          "default": 60
        },
        {
          "name": "Accuracy",
          "type": "number",
          "default": 1e-11
        },
        {
          "name": "MinStep",
          "type": "number",
          "unit": "sec",
          "default": 0.001
        },
        {
          "name": "MaxStep",
          "type": "number",
          "unit": "sec",
          "default": 2700
        },
        {
          "name": "MaxStepAttempts",
          "type": "number",
          "default": 50
        },
        {
          "name": "StopIfAccuracyIsViolated",
          "type": "boolean",
          "default": true
        }
      ]
    },
    "ImpulsiveBurn": {
      "controller": "ImpulsiveBurnPanel",
      "cppReference": "src/base/burn/ImpulsiveBurn.cpp",
      "fields": [
        {
          "name": "CoordinateSystem",
          "type": "select",
          "options": [
            "Local",
            "EarthMJ2000Eq",
            "EarthFixed"
          ],
          "default": "Local"
        },
        {
          "name": "Origin",
          "type": "select",
          "default": "Earth"
        },
        {
          "name": "Axes",
          "type": "select",
          "options": [
            "VNB",
            "LVLH",
            "MJ2000Eq",
            "SpacecraftBody"
          ],
          "default": "VNB"
        },
        {
          "name": "Element1",
          "label": "ΔV (V/Radial)",
          "type": "number",
          "unit": "km/s",
          "default": 0
        },
        {
          "name": "Element2",
          "label": "ΔV (N/Transverse)",
          "type": "number",
          "unit": "km/s",
          "default": 0
        },
        {
          "name": "Element3",
          "label": "ΔV (B/Normal)",
          "type": "number",
          "unit": "km/s",
          "default": 0
        },
        {
          "name": "DecrementMass",
          "type": "boolean",
          "default": false
        },
        {
          "name": "Isp",
          "label": "Specific Impulse",
          "type": "number",
          "unit": "s",
          "default": 300
        },
        {
          "name": "GravitationalAccel",
          "type": "number",
          "unit": "m/s²",
          "default": 9.81
        }
      ]
    },
    "FiniteBurn": {
      "controller": "FiniteBurnSetupPanel",
      "cppReference": "src/base/burn/FiniteBurn.cpp",
      "fields": [
        {
          "name": "Thrusters",
          "type": "multi-select",
          "objectType": [
            "ChemicalThruster",
            "ElectricThruster"
          ]
        },
        {
          "name": "ThrottleLogicAlgorithm",
          "type": "select",
          "options": [
            "MaxNumberOfThrusters"
          ],
          "default": "MaxNumberOfThrusters"
        }
      ]
    },
    "DifferentialCorrector": {
      "controller": "DCSetupPanel",
      "cppReference": "src/base/solver/DifferentialCorrector.cpp",
      "fields": [
        {
          "name": "ShowProgress",
          "type": "boolean",
          "default": true
        },
        {
          "name": "ReportStyle",
          "type": "select",
          "options": [
            "Normal",
            "Concise",
            "Verbose",
            "Debug"
          ],
          "default": "Normal"
        },
        {
          "name": "MaximumIterations",
          "type": "number",
          "default": 25
        },
        {
          "name": "DerivativeMethod",
          "type": "select",
          "options": [
            "ForwardDifference",
            "BackwardDifference",
            "CentralDifference"
          ],
          "default": "ForwardDifference"
        },
        {
          "name": "Algorithm",
          "type": "select",
          "options": [
            "NewtonRaphson",
            "Broyden",
            "ModifiedBroyden"
          ],
          "default": "NewtonRaphson"
        }
      ]
    },
    "VF13ad": {
      "controller": "SQPSetupPanel",
      "fields": [
        {
          "name": "ShowProgress",
          "type": "boolean",
          "default": true
        },
        {
          "name": "ReportStyle",
          "type": "select",
          "options": [
            "Normal",
            "Concise",
            "Verbose",
            "Debug"
          ],
          "default": "Normal"
        },
        {
          "name": "MaximumIterations",
          "type": "number",
          "default": 200
        },
        {
          "name": "Tolerance",
          "type": "number",
          "default": 0.00001
        },
        {
          "name": "UseCentralDifferences",
          "type": "boolean",
          "default": false
        }
      ]
    },
    "ReportFile": {
      "controller": "ReportFilePanel",
      "cppReference": "src/base/subscriber/ReportFile.cpp",
      "fields": [
        {
          "name": "Filename",
          "type": "text",
          "default": "/tmp/report.txt"
        },
        {
          "name": "Add",
          "label": "Parameters",
          "type": "parameter-selector"
        },
        {
          "name": "WriteHeaders",
          "type": "boolean",
          "default": true
        },
        {
          "name": "LeftJustify",
          "type": "select",
          "options": [
            "On",
            "Off"
          ],
          "default": "On"
        },
        {
          "name": "ZeroFill",
          "type": "select",
          "options": [
            "On",
            "Off"
          ],
          "default": "Off"
        },
        {
          "name": "FixedWidth",
          "type": "boolean",
          "default": true
        },
        {
          "name": "Delimiter",
          "type": "text",
          "default": " "
        },
        {
          "name": "ColumnWidth",
          "type": "number",
          "default": 23
        },
        {
          "name": "WriteReport",
          "type": "boolean",
          "default": true
        }
      ]
    },
    "EphemerisFile": {
      "controller": "EphemerisFilePanel",
      "fields": [
        {
          "name": "Spacecraft",
          "type": "select",
          "objectType": "Spacecraft"
        },
        {
          "name": "Filename",
          "type": "text",
          "default": "/tmp/ephemeris.bsp"
        },
        {
          "name": "FileFormat",
          "type": "select",
          "options": [
            "SPK",
            "CCSDS-OEM",
            "STK-TimePosVel",
            "Code500"
          ],
          "default": "SPK"
        },
        {
          "name": "CoordinateSystem",
          "type": "select",
          "default": "EarthMJ2000Eq"
        },
        {
          "name": "WriteEphemeris",
          "type": "boolean",
          "default": true
        },
        {
          "name": "Interpolator",
          "type": "select",
          "options": [
            "Hermite",
            "Lagrange"
          ],
          "default": "Hermite"
        },
        {
          "name": "InterpolationOrder",
          "type": "number",
          "default": 7
        },
        {
          "name": "StepSize",
          "type": "select",
          "options": [
            "IntegratorSteps"
          ],
          "default": "IntegratorSteps"
        },
        {
          "name": "OutputFormat",
          "type": "select",
          "options": [
            "LittleEndian",
            "BigEndian"
          ],
          "default": "LittleEndian"
        },
        {
          "name": "DistanceUnit",
          "type": "select",
          "options": [
            "Kilometers",
            "Meters"
          ],
          "default": "Kilometers"
        }
      ]
    },
    "OrbitView": {
      "controller": "OrbitViewPanel",
      "cppReference": "src/base/subscriber/OrbitView.cpp",
      "fields": [
        {
          "name": "Add",
          "label": "Objects to Display",
          "type": "multi-select",
          "objectType": "Spacecraft"
        },
        {
          "name": "CoordinateSystem",
          "type": "select",
          "default": "EarthMJ2000Eq"
        },
        {
          "name": "DrawObject",
          "type": "multi-select"
        },
        {
          "name": "ViewPointReference",
          "type": "select",
          "default": "Earth"
        },
        {
          "name": "ViewPointVector",
          "type": "array",
          "default": [
            0,
            0,
            120000
          ]
        },
        {
          "name": "ViewDirection",
          "type": "select",
          "default": "Earth"
        },
        {
          "name": "ViewScaleFactor",
          "type": "number",
          "default": 1
        },
        {
          "name": "ShowPlot",
          "type": "boolean",
          "default": true
        },
        {
          "name": "Axes",
          "type": "select",
          "options": [
            "On",
            "Off"
          ],
          "default": "On"
        },
        {
          "name": "Grid",
          "type": "select",
          "options": [
            "On",
            "Off"
          ],
          "default": "Off"
        },
        {
          "name": "SunLine",
          "type": "select",
          "options": [
            "On",
            "Off"
          ],
          "default": "Off"
        },
        {
          "name": "EnableStars",
          "type": "select",
          "options": [
            "On",
            "Off"
          ],
          "default": "On"
        },
        {
          "name": "StarCount",
          "type": "number",
          "default": 7000
        }
      ]
    },
    "XYPlot": {
      "controller": "XyPlotSetupPanel",
      "fields": [
        {
          "name": "XVariable",
          "type": "parameter-selector"
        },
        {
          "name": "YVariables",
          "type": "multi-parameter-selector"
        },
        {
          "name": "ShowGrid",
          "type": "boolean",
          "default": true
        },
        {
          "name": "ShowPlot",
          "type": "boolean",
          "default": true
        }
      ]
    },
    "Variable": {
      "controller": "ParameterSetupPanel",
      "fields": [
        {
          "name": "Value",
          "type": "number",
          "default": 0
        }
      ]
    },
    "Array": {
      "controller": "ParameterSetupPanel",
      "fields": [
        {
          "name": "RowCount",
          "type": "number",
          "default": 1
        },
        {
          "name": "ColCount",
          "type": "number",
          "default": 1
        }
      ]
    },
    "String": {
      "controller": "ParameterSetupPanel",
      "fields": [
        {
          "name": "Value",
          "type": "text",
          "default": ""
        }
      ]
    },
    "GroundStation": {
      "controller": "GroundStationPanel",
      "fields": [
        {
          "name": "CentralBody",
          "type": "select",
          "default": "Earth"
        },
        {
          "name": "StateType",
          "type": "select",
          "options": [
            "Cartesian",
            "Spherical",
            "Ellipsoid"
          ],
          "default": "Spherical"
        },
        {
          "name": "HorizonReference",
          "type": "select",
          "options": [
            "Sphere",
            "Ellipsoid"
          ],
          "default": "Ellipsoid"
        },
        {
          "name": "Location1",
          "label": "Latitude",
          "type": "number",
          "unit": "deg",
          "default": 0
        },
        {
          "name": "Location2",
          "label": "Longitude",
          "type": "number",
          "unit": "deg",
          "default": 0
        },
        {
          "name": "Location3",
          "label": "Altitude",
          "type": "number",
          "unit": "km",
          "default": 0
        },
        {
          "name": "Id",
          "type": "text"
        },
        {
          "name": "MinimumElevationAngle",
          "type": "number",
          "unit": "deg",
          "default": 7
        }
      ]
    },
    "CoordinateSystem": {
      "controller": "CoordSystemConfigPanel",
      "fields": [
        {
          "name": "Origin",
          "type": "select",
          "default": "Earth"
        },
        {
          "name": "Axes",
          "type": "select",
          "options": [
            "MJ2000Eq",
            "MJ2000Ec",
            "ICRF",
            "BodyFixed",
            "BodyInertial",
            "Equator",
            "ObjectReferenced",
            "TOEEq",
            "TOEEc",
            "MOEEq",
            "MOEEc",
            "TODEq",
            "TODEc",
            "MODEq",
            "MODEc",
            "GSE",
            "GSM",
            "Topocentric",
            "LocalAlignedConstrained"
          ],
          "default": "MJ2000Eq"
        },
        {
          "name": "Primary",
          "type": "select",
          "visibleWhen": "Axes in ['ObjectReferenced', 'LocalAlignedConstrained']"
        },
        {
          "name": "Secondary",
          "type": "select",
          "visibleWhen": "Axes in ['ObjectReferenced', 'LocalAlignedConstrained']"
        }
      ]
    },
    "PredefinedCoordSys": {
      "controller": "PredefinedCoordSysPanel",
      "readonly": true,
      "fields": [
        {
          "name": "Origin",
          "type": "text",
          "readonly": true
        },
        {
          "name": "Axes",
          "type": "text",
          "readonly": true
        }
      ]
    },
    "CelestialBody": {
      "controller": "CelestialBodyPanel",
      "readonly": true,
      "fields": [
        {
          "name": "Mu",
          "label": "Gravitational Parameter",
          "type": "number",
          "unit": "km³/s²",
          "readonly": true
        },
        {
          "name": "EquatorialRadius",
          "type": "number",
          "unit": "km",
          "readonly": true
        },
        {
          "name": "Flattening",
          "type": "number",
          "readonly": true
        },
        {
          "name": "RotationDataSource",
          "type": "text",
          "readonly": true
        }
      ]
    },
    "ChemicalTank": {
      "controller": "TankConfigPanel",
      "fields": [
        {
          "name": "FuelMass",
          "type": "number",
          "unit": "kg",
          "default": 756
        },
        {
          "name": "Pressure",
          "type": "number",
          "unit": "kPa",
          "default": 1500
        },
        {
          "name": "Temperature",
          "type": "number",
          "unit": "°C",
          "default": 20
        },
        {
          "name": "RefTemperature",
          "type": "number",
          "unit": "°C",
          "default": 20
        },
        {
          "name": "Volume",
          "type": "number",
          "unit": "m³",
          "default": 0.75
        },
        {
          "name": "FuelDensity",
          "type": "number",
          "unit": "kg/m³",
          "default": 1260
        },
        {
          "name": "PressureModel",
          "type": "select",
          "options": [
            "PressureRegulated",
            "BlowDown"
          ],
          "default": "PressureRegulated"
        },
        {
          "name": "AllowNegativeFuelMass",
          "type": "boolean",
          "default": false
        }
      ]
    },
    "ElectricTank": {
      "controller": "TankConfigPanel",
      "fields": [
        {
          "name": "FuelMass",
          "type": "number",
          "unit": "kg",
          "default": 756
        },
        {
          "name": "AllowNegativeFuelMass",
          "type": "boolean",
          "default": false
        }
      ]
    },
    "ChemicalThruster": {
      "controller": "ThrusterConfigPanel",
      "fields": [
        {
          "name": "CoordinateSystem",
          "type": "select",
          "default": "Local"
        },
        {
          "name": "Origin",
          "type": "select",
          "default": "Earth"
        },
        {
          "name": "Axes",
          "type": "select",
          "options": [
            "VNB",
            "LVLH",
            "MJ2000Eq",
            "SpacecraftBody"
          ],
          "default": "VNB"
        },
        {
          "name": "ThrustDirection1",
          "type": "number",
          "default": 1
        },
        {
          "name": "ThrustDirection2",
          "type": "number",
          "default": 0
        },
        {
          "name": "ThrustDirection3",
          "type": "number",
          "default": 0
        },
        {
          "name": "DutyCycle",
          "type": "number",
          "default": 1
        },
        {
          "name": "ThrustScaleFactor",
          "type": "number",
          "default": 1
        },
        {
          "name": "DecrementMass",
          "type": "boolean",
          "default": false
        },
        {
          "name": "Tank",
          "type": "select",
          "objectType": "ChemicalTank"
        },
        {
          "name": "GravitationalAccel",
          "type": "number",
          "unit": "m/s²",
          "default": 9.81
        },
        {
          "name": "C1",
          "label": "Thrust Coefficient",
          "type": "number",
          "unit": "N",
          "default": 10
        },
        {
          "name": "K1",
          "label": "Isp Coefficient",
          "type": "number",
          "unit": "s",
          "default": 300
        }
      ]
    },
    "ElectricThruster": {
      "controller": "ThrusterConfigPanel",
      "fields": [
        {
          "name": "CoordinateSystem",
          "type": "select",
          "default": "Local"
        },
        {
          "name": "Origin",
          "type": "select",
          "default": "Earth"
        },
        {
          "name": "Axes",
          "type": "select",
          "options": [
            "VNB",
            "LVLH",
            "MJ2000Eq",
            "SpacecraftBody"
          ],
          "default": "VNB"
        },
        {
          "name": "ThrustDirection1",
          "type": "number",
          "default": 1
        },
        {
          "name": "ThrustDirection2",
          "type": "number",
          "default": 0
        },
        {
          "name": "ThrustDirection3",
          "type": "number",
          "default": 0
        },
        {
          "name": "DutyCycle",
          "type": "number",
          "default": 1
        },
        {
          "name": "ThrustScaleFactor",
          "type": "number",
          "default": 1
        },
        {
          "name": "DecrementMass",
          "type": "boolean",
          "default": false
        },
        {
          "name": "Tank",
          "type": "select",
          "objectType": "ElectricTank"
        },
        {
          "name": "ThrustModel",
          "type": "select",
          "options": [
            "ConstantThrustAndIsp",
            "FixedEfficiency",
            "ThrustMassPolynomial"
          ],
          "default": "ConstantThrustAndIsp"
        },
        {
          "name": "MaximumUsablePower",
          "type": "number",
          "unit": "kW",
          "default": 7.266
        },
        {
          "name": "MinimumUsablePower",
          "type": "number",
          "unit": "kW",
          "default": 0.638
        },
        {
          "name": "ConstantThrust",
          "type": "number",
          "unit": "N",
          "default": 0.01
        },
        {
          "name": "Isp",
          "label": "Specific Impulse",
          "type": "number",
          "unit": "s",
          "default": 3000
        },
        {
          "name": "GravitationalAccel",
          "type": "number",
          "unit": "m/s²",
          "default": 9.81
        },
        {
          "name": "FixedEfficiency",
          "type": "number",
          "default": 0.7
        }
      ]
    },
    "SolarPowerSystem": {
      "controller": "PowerSystemConfigPanel",
      "fields": [
        {
          "name": "EpochFormat",
          "type": "select",
          "options": [
            "UTCGregorian",
            "TAIModJulian"
          ],
          "default": "UTCGregorian"
        },
        {
          "name": "InitialEpoch",
          "type": "datetime",
          "default": "01 Jan 2000 11:59:28.000"
        },
        {
          "name": "InitialMaxPower",
          "type": "number",
          "unit": "kW",
          "default": 1.2
        },
        {
          "name": "AnnualDecayRate",
          "type": "number",
          "unit": "%",
          "default": 5
        },
        {
          "name": "Margin",
          "type": "number",
          "unit": "%",
          "default": 5
        },
        {
          "name": "BusCoeff1",
          "type": "number",
          "default": 0.3
        },
        {
          "name": "BusCoeff2",
          "type": "number",
          "default": 0
        },
        {
          "name": "BusCoeff3",
          "type": "number",
          "default": 0
        },
        {
          "name": "ShadowModel",
          "type": "select",
          "options": [
            "DualCone",
            "Cylindrical"
          ],
          "default": "DualCone"
        },
        {
          "name": "ShadowBodies",
          "type": "multi-select",
          "default": [
            "Earth"
          ]
        }
      ]
    },
    "NuclearPowerSystem": {
      "controller": "PowerSystemConfigPanel",
      "fields": [
        {
          "name": "EpochFormat",
          "type": "select",
          "options": [
            "UTCGregorian",
            "TAIModJulian"
          ],
          "default": "UTCGregorian"
        },
        {
          "name": "InitialEpoch",
          "type": "datetime",
          "default": "01 Jan 2000 11:59:28.000"
        },
        {
          "name": "InitialMaxPower",
          "type": "number",
          "unit": "kW",
          "default": 1.2
        },
        {
          "name": "AnnualDecayRate",
          "type": "number",
          "unit": "%",
          "default": 5
        },
        {
          "name": "Margin",
          "type": "number",
          "unit": "%",
          "default": 5
        },
        {
          "name": "BusCoeff1",
          "type": "number",
          "default": 0.3
        },
        {
          "name": "BusCoeff2",
          "type": "number",
          "default": 0
        },
        {
          "name": "BusCoeff3",
          "type": "number",
          "default": 0
        }
      ]
    },
    "EclipseLocator": {
      "controller": "EclipseLocatorPanel",
      "fields": [
        {
          "name": "Spacecraft",
          "type": "select",
          "objectType": "Spacecraft"
        },
        {
          "name": "OccultingBodies",
          "type": "multi-select",
          "default": [
            "Luna"
          ]
        },
        {
          "name": "InputEpochFormat",
          "type": "select",
          "options": [
            "UTCGregorian",
            "TAIModJulian"
          ],
          "default": "UTCGregorian"
        },
        {
          "name": "InitialEpoch",
          "type": "datetime",
          "default": "01 Jan 2024 00:00:00.000"
        },
        {
          "name": "FinalEpoch",
          "type": "datetime",
          "default": "01 Jan 2024 12:00:00.000"
        },
        {
          "name": "StepSize",
          "type": "number",
          "unit": "sec",
          "default": 10
        },
        {
          "name": "EclipseTypes",
          "type": "multi-select",
          "options": [
            "Umbra",
            "Penumbra",
            "Antumbra"
          ],
          "default": [
            "Umbra",
            "Penumbra",
            "Antumbra"
          ]
        }
      ]
    },
    "ContactLocator": {
      "controller": "ContactLocatorPanel",
      "fields": [
        {
          "name": "Target",
          "type": "select",
          "objectType": [
            "Spacecraft",
            "GroundStation"
          ]
        },
        {
          "name": "Observer",
          "type": "select",
          "objectType": [
            "Spacecraft",
            "GroundStation"
          ]
        },
        {
          "name": "LightTimeDirection",
          "type": "select",
          "options": [
            "Transmit",
            "Receive"
          ],
          "default": "Transmit"
        },
        {
          "name": "InputEpochFormat",
          "type": "select",
          "options": [
            "UTCGregorian",
            "TAIModJulian"
          ],
          "default": "UTCGregorian"
        },
        {
          "name": "InitialEpoch",
          "type": "datetime",
          "default": "01 Jan 2024 00:00:00.000"
        },
        {
          "name": "FinalEpoch",
          "type": "datetime",
          "default": "01 Jan 2024 12:00:00.000"
        },
        {
          "name": "StepSize",
          "type": "number",
          "unit": "sec",
          "default": 10
        }
      ]
    },
    "FileInterface": {
      "controller": "FileInterfacePanel",
      "fields": [
        {
          "name": "Filename",
          "type": "text"
        },
        {
          "name": "Format",
          "type": "select",
          "options": [
            "TextFile"
          ],
          "default": "TextFile"
        }
      ]
    },
    "GmatFunction": {
      "controller": "FunctionSetupPanel",
      "fields": [
        {
          "name": "FunctionPath",
          "type": "text"
        }
      ]
    }
  },
  "dialogs": {
    "about": {
      "title": "About GMAT Web GUI",
      "content": [
        {
          "type": "heading",
          "text": "GMAT Web GUI"
        },
        {
          "type": "paragraph",
          "text": "General Mission Analysis Tool - WebAssembly Edition"
        },
        {
          "type": "paragraph",
          "text": "This is a web-based interface for GMAT compiled to WebAssembly."
        },
        {
          "type": "link",
          "text": "GMAT Documentation",
          "url": "https://gmat.atlassian.net/wiki/spaces/GW"
        }
      ]
    },
    "welcome": {
      "title": "Welcome to GMAT Web GUI",
      "sections": [
        {
          "title": "Getting Started",
          "items": [
            "Click \"Load Sample\" to load an example mission",
            "Press F5 or click \"Run\" to execute the mission",
            "View results in the 3D Orbit tab and Output tab"
          ]
        }
      ]
    },
    "confirmUnsaved": {
      "title": "Unsaved Changes",
      "message": "You have unsaved changes. Do you want to save before continuing?",
      "buttons": [
        {
          "label": "Save",
          "action": "save"
        },
        {
          "label": "Don't Save",
          "action": "discard"
        },
        {
          "label": "Cancel",
          "action": "cancel"
        }
      ]
    }
  },
  "keyboardShortcuts": [],
  "contextMenus": {},
  "celestialBodies": {}
};

// Convenience exports
export const { meta, menuBar, toolbar, layout, panels, dialogs, keyboardShortcuts, contextMenus, celestialBodies } = UI_CONFIG;

export default UI_CONFIG;
