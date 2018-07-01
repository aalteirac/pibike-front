picasso.use(picassoQ);
picasso.use(picassoHammer);

let _current = null;
let _dt=[];

var spUnit;
var dstUnit;

class Scatterplot {
    constructor() {
        this.axisPainted = false;
        this.pic = null;
        picasso.component('dompoint', Scatterplot.dompoint())
    }

    static get current() {
        return _current;
    }
    static set current(value) {
        _current = value;
    }

    static get cached() {
        return _dt;
    }

    static set cached(value) {
        _dt = value;
    }

    //update(){
    //    scatterplot.pic.update({
    //        data: [{
    //            type: 'q',
    //            key: 'qHyperCube',
    //            data: scatterplot.lay.qHyperCube,
    //        }],
    //        settings:scatterplot.settings,
    //    });
    //}

    paintScatterplot(element, layout, bike,model,spUn,dstUn) {
        spUnit=spUn;
        dstUnit=dstUn;
        if (!(layout.qHyperCube &&
            layout.qHyperCube.qDataPages &&
            layout.qHyperCube.qDataPages[0] &&
            layout.qHyperCube.qDataPages[0].qMatrix)
        ) {
            return;
        }

        var settings = Scatterplot.scotterplot();
        if (bike == true) {
            settings = Scatterplot.bikeplot();
            var el=document.getElementById('navbutton')
            if(el)
                el.parentNode.parentNode.removeChild(el.parentNode)
        }
        this.settings=settings;
        if (!this.pic) {
            this.model=model;
            this.lay=layout;
            this.el=element;
            this.bike=bike;
            this.pic = picasso.chart({
                element,
                data: [{
                    type: 'q',
                    key: 'qHyperCube',
                    data: layout.qHyperCube,
                }],
                settings,
            });
            this.pic.brush('highlight').on('update', (added) => {
                var selections= picassoQ.qBrushHelper(scatterplot.pic.brush('highlight'));
                //console.log(scatterplot.pic.lass);
                if(selections[0] && selections[0].params[2] && (scatterplot.pic.lass==null || scatterplot.pic.lass==false))
                    scatterplot.model.selectHyperCubeValues("/qHyperCubeDef",0,selections[0].params[2],false).then(()=> {
                    })
            });
            this.pic.brush('tooltip').on('update', (added) => {
                if (added.length && (scatterplot.pic.lass==null || scatterplot.pic.lass==false)) {
                    const s = this.pic.getAffectedShapes('tooltip')[0];
                    const rect = s.element.getBoundingClientRect();
                    const p = {
                        x: s.bounds.x + s.bounds.width + rect.x + 5,
                        y: s.bounds.y + (s.bounds.height / 2) + (rect.y - 28),
                    };
                    Scatterplot.showTooltip('<p> Rider: ' + s.data.label + '</p><p>Top Speed: ' + (s.data.y.value).toFixed(2) + '</p><p>Distance: ' + ( s.data.x.value).toFixed(3) + '</p>', p);//<p>Avg Heart Rate: ' +(s.data.cost.value).toFixed(2) +'</p><p>Avg Speed: '+( s.data.rating.value).toFixed(2)+'</p>'
                } else {
                    Scatterplot.hideTooltip();
                }
            });
        } else {
            this.model=model;
            this.lay=layout;
            this.el=element;
            this.bike=bike;
            this.pic.update({
                data: [{
                    type: 'q',
                    key: 'qHyperCube',
                    data: layout.qHyperCube,
                }],
                settings,
            });
        }
    }

    static hideTooltip() {
        const elements = document.getElementsByClassName('tooltip');
        if (elements[0]) {
            document.body.removeChild(elements[0]);
        }
    }

    static showTooltip(text, point) {
        Scatterplot.hideTooltip();
        const currentTooltip = document.createElement('div');
        currentTooltip.innerHTML = text;
        currentTooltip.style.position = 'absolute';
        currentTooltip.style.top = '-99999px';
        currentTooltip.style.left = '-99999px';
        currentTooltip.classList.add('tooltip');

        document.body.appendChild(currentTooltip);

        // Reposition the tooltip
        currentTooltip.style.top = `${point.y-80}px`;
        currentTooltip.style.left = `${(point.x - 170)}px`;
    }

    static dompoint() {
        var _this;
        return ({
            require: ['resolver'],
            renderer: 'dom',
            defaultSettings: {
                settings: {}
            },
            beforeRender(options) {
                _this = this;
                this.size = options.size
                //dt=[];
            },
            generatePoints(data) {
                var colCur = "white";
                return data.items.map((row, id) => {
                    var curPoint = row;
                    var res;
                    var isCached = false;
                    if (Scatterplot.current != null && row.data.label.split(' - ')[1] == Scatterplot.current)
                        colCur = 'forestgreen';
                    else {
                        colCur = "white";
                    }
                    if (Scatterplot.cached.length > 0)
                        Scatterplot.cached.map((cc)=> {
                            if (cc.data.label.split(' - ')[1] == row.data.label.split(' - ')[1]) {
                                curPoint = cc;
                                isCached = true;
                            }
                        })
                    if (isCached) {
                        Scatterplot.cached.map((cc)=> {
                            if (cc.data.label.split(' - ')[1] == row.data.label.split(' - ')[1])
                                curPoint = cc;
                        })
                        if (curPoint.x != row.x || curPoint.y != row.y) {
                            var toTop = ((_this.size.height * row.y) - (data.settings.height / 2)).toFixed(2);
                            var toLeft = ((_this.size.width * row.x) - (data.settings.width / 2)).toFixed(2);
                            var fromLeft = ((_this.size.width * curPoint.x) - (data.settings.width / 2)).toFixed(2);
                            var fromTop = ((_this.size.height * curPoint.y) - (data.settings.height / 2)).toFixed(2);
                            var ttp = (_this.size.height * curPoint.y) - (data.settings.height / 2);
                            var lft = (_this.size.width * curPoint.x) - (data.settings.width / 2);
                            isNaN(fromTop) ? fromTop = 0 : fromTop = fromTop;
                            isNaN(toTop) ? toTop = 0 : toTop = toTop;
                            if (curPoint.data.label != '-')
                                addKeyFrames(
                                    curPoint.data.label.replace(/^[^a-z]+|[^\w:.-]+/gi, ""),
                                    `from {left:${fromLeft}px;top: ${fromTop}px;}
                                 to {left:${toLeft}px;top: ${toTop}px;}`
                                )
                            const style = {
                                position: 'absolute',
                                left: `${(this.size.width * row.x) - (data.settings.width / 2)}px`,
                                top: `${(this.size.height * row.y) - (data.settings.height / 2)}px`,
                                width: `${data.settings.width}px`,
                                color: colCur,
                                height: `${data.settings.height}px`,
                                "animation-timing-function": "linear",
                                'white-space': "nowrap",
                                animation: curPoint.data.label.replace(/^[^a-z]+|[^\w:.-]+/gi, "") + " 5.0s",
                            }
                            const ILLEGAL_KEY_NAMES = ['x', 'y', 'width', 'height', 'left', 'top', 'position']
                            Object.keys(data.settings)
                                .filter(key => ILLEGAL_KEY_NAMES.indexOf(key) === -1)
                                .forEach(key => style[key] = data.settings[key])
                            res = this.h('div', {attrs: {'id': row.data.value},attrs: {'class': 'bike'}, style}, row.data.label+' '+ parseFloat(row.data.x.label).toFixed(1))
                            setTimeout(()=> {
                                Scatterplot.cached.push(row)
                            }, 2000);
                        } else {
                            const style = {
                                position: 'absolute',
                                left: `${(this.size.width * row.x) - (data.settings.width / 2)}px`,
                                top: `${(this.size.height * row.y) - (data.settings.height / 2)}px`,
                                width: `${data.settings.width}px`,
                                height: `${data.settings.height}px`,
                                color: colCur,
                                'white-space': "nowrap"
                                //animation: curPoint.data.label.replace(/^[^a-z]+|[^\w:.-]+/gi, "") + " 5.0s",
                            }
                            const ILLEGAL_KEY_NAMES = ['x', 'y', 'width', 'height', 'left', 'top', 'position']
                            Object.keys(data.settings)
                                .filter(key => ILLEGAL_KEY_NAMES.indexOf(key) === -1)
                                .forEach(key => style[key] = data.settings[key])
                            res = this.h('div', {attrs: {'id': row.data.value},attrs: {'class': 'bike'}, style}, row.data.label+' '+ parseFloat(row.data.x.label).toFixed(1))
                        }
                    }
                    else {
                        Scatterplot.cached.push(row);
                        //Todo treat NAN
                        var ttp = (_this.size.height * curPoint.y) - (data.settings.height / 2);
                        var lft = (_this.size.width * curPoint.x) - (data.settings.width / 2);
                        isNaN(ttp) ? ttp = 0 : ttp = ttp;
                        isNaN(lft) ? lft = 0 : lft = lft;
                        if (curPoint.data.label != '-')
                            addKeyFrames(
                                curPoint.data.label.replace(/^[^a-z]+|[^\w:.-]+/gi, ""),
                                `from {left:0px;top: 0px;}
                             to {left:${lft}px;top: ${ttp}px;}`
                            )
                        const style = {
                            position: 'absolute',
                            left: `${(this.size.width * curPoint.x) - (data.settings.width / 2)}px`,
                            top: `${(this.size.height * curPoint.y) - (data.settings.height / 2)}px`,
                            width: `${data.settings.width}px`,
                            height: `${data.settings.height}px`,
                            'white-space': "nowrap",
                            color: colCur,
                            "animation-timing-function": "linear",
                            animation: curPoint.data.label.replace(/^[^a-z]+|[^\w:.-]+/gi, "") + " 5.0s"
                        }
                        const ILLEGAL_KEY_NAMES = ['x', 'y', 'width', 'height', 'left', 'top', 'position']
                        Object.keys(data.settings)
                            .filter(key => ILLEGAL_KEY_NAMES.indexOf(key) === -1)
                            .forEach(key => style[key] = data.settings[key])
                        res = this.h('div', {
                            attrs: {'id': curPoint.data.value},
                            attrs: {'class': 'bike'},
                            style
                        }, curPoint.data.label +' '+ parseFloat(curPoint.data.x.label).toFixed(1))
                    }
                    return res;
                })
            },
            render(h, { data }) {
                this.h = h //snabbdom reference

                const resolved = this.resolver.resolve({
                    data,
                    settings: this.settings.settings,
                    //defaults: Object.assign({}, DEFAULT_SETTINGS),
                    scaled: {
                        x: this.size.width,
                        y: this.size.height
                    }
                })

                return this.generatePoints(resolved)
            },
        })
    }

    static scotterplot() {
        return {
            scales: {
                s: {
                    data: {
                        field: 'qMeasureInfo/0',
                    },
                    expand: 0.2,
                    invert: true,
                },
                m: {
                    data: {
                        field: 'qMeasureInfo/1',
                    },
                    expand: 0.2,
                },
                col: {
                    data: {
                        extract: {
                            field: 'qDimensionInfo/0',
                            props: {
                                nm: {value: v => v.qText}
                            }
                        }
                    },
                    type: 'color',
                },
            },
            components: [
                {
                    key: 'y-axis',
                    type: 'axis',
                    scale: 's',
                    dock: 'left',
                },
                //{
                //    key:  'leg',
                //    type: 'legend-cat',
                //    dock: 'right',
                //    scale: 'col',
                //    settings: {
                //        title: {
                //            show: false
                //        },
                //        navigation: {
                //            button: {
                //                class: {
                //                    'my-button': true
                //                },
                //                content: function (h, state) {
                //                    document.getElementById('navbutton');
                //                }
                //            }
                //        }
                //    }
                //},
                {
                    key: 'lassoComp',
                    displayOrder:300,
                    type: 'brush-lasso',
                    settings:{
                        lasso: {
                            fill: 'grey', // Optional
                            stroke: 'white', // Optional
                            strokeWidth: 2, // Optional
                            opacity: 0.3, // Optional
                        },
                        snapIndicator: {  // Optional
                            // Snap indicator settings
                            threshold: 75, // The distance in pixel to show the snap indicator, if less then threshold the indicator is dispalyed // Optional
                            strokeDasharray: '5, 5', // Optional
                            stroke: 'white', // Optional
                            strokeWidth: 2, // Optional
                            opacity: 0.5, // Optional
                        },
                        startPoint: {  // Optional
                            // Start point style settings
                            fill: 'white',
                            r: 5, // Circle radius // Optional
                            stroke: 'white', // Optional
                            strokeWidth: 1, // Optional
                            opacity: 1, // Optional
                        },
                        brush: {
                            components: [
                                {
                                    key: 'p',
                                    contexts: ['highlight'],
                                    //action:"add",
                                }
                            ]
                        }
                    }
                },
                {
                    key: 'x-axis',
                    type: 'axis',
                    scale: 'm',
                    dock: 'bottom',
                    formatter: {
                        formatter: 'd3',
                        type: 'number',
                        format: '.3n'
                    }
                },
                {
                    key: 'p',
                    type: 'point',
                    displayOrder: 2,
                    data: {
                        extract: {
                            field: 'qDimensionInfo/0',
                            props: {
                                y: {field: 'qMeasureInfo/0'},
                                x: {field: 'qMeasureInfo/1'},
                                num: {field: 'qMeasureInfo/0'},
                                qMeasure: {field: 'qMeasureInfo/0'},
                                qMeasure2: {field: 'qMeasureInfo/1'},
                                group:{field: 'qDimensionInfo/0'},
                                qDimension: data => data,
                            },
                        },
                    },
                    settings: {
                        x: {scale: 'm'},
                        y: {scale: 's'},
                        shape: 'circle',
                        size: 0.25,
                        strokeWidth: 2,
                        //stroke: '#fff',
                        opacity: 1,
                        fill: {scale: 'col',ref:'group'},
                    },
                    brush: {
                        trigger: [
                            //{
                            //    on: 'tap',
                            //    data: ['qDimension', 'qMeasure'],
                            //    contexts: ['tooltip'],
                            //},
                            {
                                on: 'over',
                                action: 'set',
                                contexts: ['tooltip'],
                                data: ['qDimension', 'qMeasure'],
                                //propagation: 'c',
                            }
                        ],
                        consume: [
                            {
                                context: 'highlight',
                                style: {
                                    active: {
                                        fill: '#77b62a',
                                        stroke: '#333',
                                        strokeWidth: 1,
                                    },
                                    inactive: {
                                        opacity: 1,
                                    },
                                },

                            }
                        ]
                    },
                },
                {
                    type: 'text',
                    text: 'Top Speed ('+spUnit+')',
                    dock: 'left',
                    settings: {
                        anchor: 'center'
                    }
                },
                {
                    type: 'text',
                    text: 'Distance in '+dstUnit,
                    dock: 'bottom',
                    settings: {
                        anchor: 'center'
                    }
                },
                {
                    type: 'labels',
                    displayOrder: 5,
                    settings: {
                        sources: [{
                            component: 'p',
                            selector: 'circle',
                            strategy: {
                                type: 'bar',
                                settings: {
                                    direction: 'left',
                                    fontFamily: 'Helvetica',
                                    fontSize: 1,
                                    color: 'white',
                                    //justify: "center",
                                    labels: [{
                                        placements: [
                                            { position: 'inside', fill: '#fff' },
                                            //{position: 'outside', fill: '#666'},
                                        ],
                                        label ({data}) {return data ? data.label : ''}
                                    }],
                                },
                            },
                        }],
                    },
                }
            ],
            interactions: [
                {
                    type: 'hammer',
                    gestures: [{
                        type: 'Pan',
                        events: {
                            panstart: function onPanStart(e) {
                                // If it should trigger only on a specific component, use chartInstance.componentsFromPoint() to determine if start point is valid or not
                                this.chart.lass=true;
                                this.chart.component('lassoComp').emit('lassoStart', e);
                            },
                            pan: function onPan(e) {
                                this.chart.component('lassoComp').emit('lassoMove', e);
                            },
                            panend: function onPanEnd(e) {
                                this.chart.lass=false;
                                var f=this.chart.component('lassoComp');
                                f.emit('lassoEnd', e);
                            }
                        }
                    }]
                }
            ]
        };
    }

    static bikeplot() {
        return {
            scales: {
                x: {data: {field: 'qMeasureInfo/1'}, expand: 0.4},//min: 10, max: 30
                y: {data: {field: 'qMeasureInfo/0'}, expand: 0.1, invert: true},//min: 50, max: 200,
                col: {
                    data: {
                        extract: {
                            field: 'qDimensionInfo/0',
                            props: {
                                nm: {value: v => v.qText}
                            }
                        }
                    },
                    type: 'color',
                    range: ['green', 'yellow', "red", 'white', 'blue']
                }
            },
            components: [
                {
                    key: 'y-axis',
                    type: 'axis',
                    scale: 'y',
                    dock: 'left'
                },
                {
                    key: 'x-axis',
                    type: 'axis',
                    scale: 'x',
                    dock: 'bottom',
                    formatter: {
                        formatter: 'd3',
                        type: 'number',
                        format: '.3n'
                    }
                },
                {
                    type: 'text',
                    text: 'Top Speed ('+spUnit+')',
                    dock: 'left',
                    settings: {
                        anchor: 'center'
                    }
                },
                {
                    type: 'text',
                    text: 'Distance in '+dstUnit,
                    dock: 'bottom',
                    settings: {
                        anchor: 'center'
                    }
                },
                {
                    type: 'dompoint',
                    data: {
                        extract: {
                            field: 'qDimensionInfo/0',
                            props: {
                                y: {field: 'qMeasureInfo/0'},
                                x: {field: 'qMeasureInfo/1'},
                                group: {field: 'qDimensionInfo/0'}
                            }
                        }
                    },
                    // you can define any html style attributes here
                    settings: {
                        width: 45,
                        height: 45,
                        'background-image': 'url(./img/bike.png)',//linear-gradient( rgba(82, 154, 28, 0.92), rgba(232, 210, 210, 0) ),
                        'background-size': 'cover',
                        'font-size': '13px',
                        'line-height': '0',
                        'font-weight': '900',
                        //'color':'#1b8716',
                        //'background-color': 'black',
                        'background-position-y': '4px',
                        x: {scale: 'x'},
                        y: {scale: 'y'},
                    },
                    brush: {
                        trigger: [{
                            on: 'tap',
                            action: 'set',
                            data: 'qDimensionInfo/0',
                            propagation: 'stop',
                            contexts: ['highlight'],
                        }, {
                            on: 'over',
                            action: 'set',
                            data: ['group', 'y', 'x'],
                            propagation: 'stop',
                            contexts: ['tooltip'],
                        }],
                    }
                }
            ]
        }
    }

    static simpleScat() {
        return  {
            scales: {
                s: {
                    data: {
                        field: 'qMeasureInfo/0'
                    },
                    expand: 0.2,
                    invert: true
                },
                m: {
                    data: {
                        field: 'qMeasureInfo/1'
                    },
                    expand: 0.1
                },
                col: {
                    data: { extract: { field: 'qDimensionInfo/0' } },
                    type: 'color'
                }
            },
            components: [{
                key: 'y-axis',
                type: 'axis',
                scale: 's',
                dock: 'left'
            }, {
                type: 'legend-cat',
                dock: 'right',
                scale: 'col'
            }, {
                key: 'x-axis',
                type: 'axis',
                scale: 'm',
                dock: 'bottom'
            }, {
                key: 'p',
                type: 'point',
                data: {
                    extract: {
                        // field: 'qMeasureInfo/1',
                        props: {
                            y: { field: 'qMeasureInfo/0' },
                            x: { field: 'qMeasureInfo/1' },
                            group: { field: 'qDimensionInfo/0' }
                        }
                    }
                },
                settings: {
                    x: { scale: 'm' },
                    y: { scale: 's' },
                    shape: 'circle',
                    size: () => Math.random(),
                    strokeWidth: 2,
                    stroke: '#fff',
                    opacity: 0.8,
                    fill: { scale: 'col', ref: 'group' }
                }
            }]
        }
    }
}
