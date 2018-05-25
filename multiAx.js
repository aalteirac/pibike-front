picasso.use(picassoQ);
picasso.use(picassoHammer);

const colors = {
    Speed: '#2489ce',
    Cadence: '#6c0'
}

class MultiAx {
    constructor() {
        this.pic = null;
    }

    paintChart(element, layout) {
        //if (!(layout.qHyperCube &&
        //    layout.qHyperCube.qDataPages &&
        //    layout.qHyperCube.qDataPages[0] &&
        //    layout.qHyperCube.qDataPages[0].qMatrix)
        //) {
        //    return;
        //}

        var settings = MultiAx.mx();
        this.settings=settings;
        var arr = [
            ['Time', 'Speed', 'Cadence']
        ];
        //arr=arr.concat(layout);
        layout.map((el)=>{
            arr.push([el[0].qNum,el[1].qNum,el[2].qNum])
        })
        var rdata=[{
            type: 'matrix',
            data: arr
        }]
        if (!this.pic) {

            this.pic = picasso.chart({
                element,
                data:rdata,
                //data: [{
                //    type: 'q',
                //    key: 'qHyperCube',
                //    data: layout.qHyperCube,
                //}],
                settings,
            });

        } else {
            this.pic.update({
                data:rdata,
                //data: [{
                //    type: 'q',
                //    key: 'qHyperCube',
                //    data: layout.qHyperCube,
                //}],
                settings,
            });
        }
    }
    static line (scale, ref, stroke,widt) {
        return {
            type: 'line',
            data: {
                collection: 'lines'
            },
            settings: {
                coordinates: {
                    major: { scale: 'time' },
                    minor: { scale, ref }
                },
                layers: {
                    curve: 'monotone',
                    line: {
                        strokeWidth: widt,
                        stroke
                    }
                }
            }
        };
    }

    static mx() {
       return {
           collections: [{
               key: 'lines',
               data: {
                   extract: {
                       field: 'Time',
                       props: {
                           speed: { field: 'Speed', },
                           cadence: { field: 'Cadence',}
                       }
                   }
               }
           }],
           scales: {
               scSpeed: {
                   data: { field: 'Speed' },
                   invert: true,
                   min: 0,
                   max: 65
                   //expand: 0.2
               },
               scCadence: {
                   data: { field: 'Cadence',},
                   invert: true,
                   min: 0,
                   //max: 160
                   //expand: 0.2
               },
               time: {data: { extract: { field: 'Time' } } }
           },
           components: [
               {
               type: 'axis',
               dock: 'right',
               scale: 'scSpeed',
               //formatter: {
               //    type: 'd3-number',
               //    format: '$,.1r'
               //},
               settings: {
                   labels: {
                       fill: colors.Speed
                   }
               },
           },{
               type: 'axis',
               dock: 'left',
               scale: 'scCadence',
               settings: {
                   labels: {
                       fill: colors.Cadence
                   }
               },
               //formatter: {
               //    type: 'd3-number',
               //    format: '.0%'
               //}
           },{
               type: 'axis',
               dock: 'bottom',
               scale: 'time',
               settings: {
                   labels: {
                       maxLengthPx: 55,
                       minLengthPx:55,
                   }
               },
               formatter: {
                   type: 'd3-time',
                   format: '%H:%M:%S'
               }
           },
               {
                   type: 'text',
                   text: 'Mph',
                   dock: 'right',
                   settings: {
                       anchor: 'center'
                   }
               },
               {
                   type: 'text',
                   text: 'LAST 3MN...',
                   dock: 'top',
                   settings: {
                       anchor: 'center',
                   }
               },
               {
                   type: 'text',
                   text: 'Rpm',
                   dock: 'left',
                   settings: {
                       anchor: 'center'
                   }
               },{
               type: 'legend-cat',
               dock: 'left',
                   layout:{size: 1},
               scale: {
                   type: 'categorical-color',
                   data: ['Cadence','Speed'],
                   range: [colors.Cadence, colors.Speed]
               }
           }, MultiAx.line('scCadence', 'cadence', colors.Cadence,1),
               MultiAx.line('scSpeed', 'speed', colors.Speed,6)
           ]
       }

    }

    static mxArea(){
        return {
            scales: {
                y: {
                    data: { fields: ['qMeasureInfo/0', 'qMeasureInfo/1'] },
                    invert: true,
                    expand: 0.4
                },
                t: { data: { extract: { field: 'qDimensionInfo/0' } } }
            },
            components: [
              {
                type: 'axis',
                dock: 'left',
                scale: 'y'
            },{
                type: 'axis',
                dock: 'bottom',
                scale: 't',
                formatter: {
                    formatter: 'd3', // The type of formatter to use
                    type: 'time', // The type of data to format
                    format: '%Y-%m-%d' // Format pattern
                },
                settings:{
                    ticks: {
                        show: true, // Toggle ticks on/off // Optional
                        margin: 0, // Space in pixels between the ticks and the line. // Optional
                        tickSize: 8, // Size of the ticks in pixels. // Optional
                    },
                    minorTicks: {
                        show: true, // Toggle minor-ticks on/off // Optional
                        tickSize: 3, // Size of the ticks in pixels. // Optional
                        margin: 0, // Space in pixels between the ticks and the line. // Optional
                    },
                    line: {
                        show: true, // Toggle line on/off // Optional
                    }
                }
            }, {
                key: 'lines',
                type: 'line',
                data: {
                    extract: {
                        field: 'qDimensionInfo/0',
                        props: {
                            low: { field: 'qMeasureInfo/0' },
                            high: { field: 'qMeasureInfo/1' }
                        }
                    }
                },
                settings: {
                    coordinates: {
                        major: { scale: 't' },
                        minor0: { scale: 'y', ref: 'low' },
                        minor: { scale: 'y', ref: 'high' }
                    },
                    layers: {
                        curve: 'monotone',
                        line: {
                            show: false
                        },
                        area: {}
                    }
                }
            }]
        }
    }

    static mxA(){
        return {
            scales: {
                y: {
                    data: { field: 'qMeasureInfo/0' },
                    invert: true,
                    expand: 0.2,
                    min: 0
                },
                t: { type:'linear',data: { extract: { field: 'qDimensionInfo/0', value:(v)=>v.qNum } } }
            },
            components: [{
                type: 'axis',
                dock: 'left',
                scale: 'y'
            },{
                type: 'axis',
                dock: 'bottom',
                scale: 't'
            }, {
                key: 'lines',
                type: 'line',
                data: {
                    extract: {
                        field: 'qDimensionInfo/0',value:(v)=>v.qNum,
                        props: {
                            v: { field: 'qMeasureInfo/0' }
                        }
                    }
                },
                settings: {
                    coordinates: {
                        major: { scale: 't' },
                        minor: { scale: 'y', ref: 'v' }
                    },
                    layers: {
                        curve: 'monotone',
                        line: {
                            show: false
                        },
                        area: {}
                    }
                }
            }]
        }
    }
}
