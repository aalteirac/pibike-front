var curRider;
var simuPort = '3000'
var curLay;
var curLineLay;
var curApp;
const mInMile=0.000621371;
const scatterplot = new Scatterplot();
const linechart = new MultiAx();
var liveSpeed,liveCadence;
var scatterModel;
var lineModel;
var session;
var blInt;
var countRepeat=30,countError = 10;
var runTime=180000;
const shownValues=370;
var prevLay={};
var prevLineLay={};
var topOnly=false;
const SPEED_UNIT="K"; //const SPEED_UNIT="K" or "M"
const CURRENCY_UNIT="E"; //const DIST_UNIT="E" or "D"
const MONEY_PER_UNIT=50;

var myReuseableStylesheet = document.createElement('style'),
    addKeyFrames = null;
document.head.appendChild(myReuseableStylesheet);

document.addEventListener('init', function (event) {
    var page = event.target;

    if (page.matches('#details-page')) {  //when the playlist-page is initialized the name of the selected playlist will be written on the toolbar
        page.querySelector('#rider_title').innerHTML = curRider;
    }

    if (page.matches('#browse-page')) {
        if (curLay)
            paintChart(curLay)
    }
});

var formatterUS = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

var formatterEU = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

function getFormatter(){
    if(CURRENCY_UNIT=='D')
        return formatterUS;
    return formatterEU;
}

function ding(){
    //var audio = new Audio('audio/dring.mp3');
    //audio.play();
}

async function patchTop5(){
    var patches = [{
        'qPath': '/qHyperCubeDef/qDimensions/0/qDef/qFieldDefs/0',
        'qOp': 'replace',
        'qValue': `"=AGGR(IF((Rank(sum(Distance))<=5),  [Rank] & ' - ' & RiderID),RiderID)"`
    }];
    scatterModel.applyPatches( patches, true );
}

async function patchTop5AndCurrent(rn){
    var patches = [{
        'qPath': '/qHyperCubeDef/qDimensions/0/qDef/qFieldDefs/0',
        'qOp': 'replace',
        'qValue': `"=AGGR(IF((Rank(sum(Distance))<=5) or  Match(RiderID, '${rn}'),  [Rank] & ' - ' & RiderID),RiderID)"`
    }];
    scatterModel.applyPatches( patches, true );
}

async function patchLineRun(rn){
    var patches = [{
        'qPath': '/qHyperCubeDef/qDimensions/0/qDef/qFieldDefs/0',
        'qOp': 'replace',
        'qValue': `"=IF(Match(RiderID, '${rn}'),TimeStamp)"`
    }];
    lineModel.applyPatches( patches, true );
}

async function patchLineReset(){
    var patches = [{
        'qPath': '/qHyperCubeDef/qDimensions/0/qDef/qFieldDefs/0',
        'qOp': 'replace',
        'qValue': `"=TimeStamp"`
    }];
    lineModel.applyPatches( patches, true );
}

async function patchRun(rn){
    var patches = [{
        'qPath': '/qHyperCubeDef/qDimensions/0/qDef/qFieldDefs/0',
        'qOp': 'replace',
        //'qValue': `"=RiderID"`
        'qValue': `"=AGGR(IF((([Rank]>only(total{1<RiderID={${rn}}>}Rank)-3) and ([Rank]<only(total{1<RiderID={${rn}}>}Rank)+3)) or  Match(RiderID, '${rn}'), [Rank] & ' - ' & RiderID),RiderID)"`
    }];
    scatterModel.applyPatches( patches, true );
}

async function patchDim(){
    var patches = [{
        'qPath': '/qHyperCubeDef/qDimensions/0/qDef/qFieldDefs/0',
        'qOp': 'replace',
        'qValue': `"=AGGR([Rank] & ' - ' & RiderID,RiderID)"`
    }];
    scatterModel.applyPatches( patches, true );
}

async function startRun(simu = false) {
    var rn=document.getElementById("username").value;
    var ro=document.getElementById("company").value;
    if(rn=='' || ro==''){
        //ons.notification.toast('Please enter name & company', {animation: 'fall' })
        ons.notification.toast('Please enter name & company', { timeout: 2000, animation: 'fall' })
        return;
    }
    var res;
    if(simu==false)
        res = JSON.parse(await httpGet(`http://${hostPI}:${simuPort}/restart/?r=${encodeURIComponent(rn)}&rc=${encodeURIComponent(ro)}&t=${runTime}`));
    else
        res = JSON.parse(await httpGet(`http://${hostPI}:${simuPort}/simu/?r=${encodeURIComponent(rn)}&rc=${encodeURIComponent(ro)}&t=${runTime}`));
    if(res.result=="Started") {
        Scatterplot.current=rn;
        document.querySelector('#navigator').popPage();
        setTimeout(()=>{
            ons.notification.toast('Start pedaling NOW !!', { timeout: 8000, animation: 'fall' })
        },1000)
        document.getElementById("newrun").setAttribute("disabled", "true");
        document.getElementById("tops").setAttribute("disabled", "true");
        document.getElementById("cktop").setAttribute("checked", "");
        topOnly=true;
        setTimeout(()=> {
            patchRun(rn);
            patchLineRun(rn);
        },9000)

        setTimeout(()=> {
            ons.notification.toast('Come on !! Still 10 seconds !!', { timeout: 3000, animation: 'ascend' })
        },runTime-10000)
        setTimeout(()=> {
            ons.notification.toast('Unleash the Power !! 30 seconds !!', { timeout: 3000, animation: 'ascend' })
        },runTime-30000)
        setTimeout(()=> {
            ons.notification.toast('All good ? 2mn remaining', { timeout: 3000, animation: 'ascend' })
        },runTime-120000)
        setTimeout(()=> {
            ons.notification.toast('Still alive ? 1mn to go', { timeout: 3000, animation: 'ascend' })
        },runTime-60000)
        if (curLay)
            paintChart(curLay)
        setTimeout(()=> {
            setTimeout(()=> {patchTop5AndCurrent(rn);patchLineReset()},2000);
            document.getElementById("newrun").removeAttribute("disabled");
            document.getElementById("tops").removeAttribute("disabled");
            //Scatterplot.current=null;
            liveSpeed.set(0);
            liveCadence.set(0);
            Scatterplot.cached=[];
            ons.notification.toast('Calm down, it\'s finished !!', { timeout: 4000, animation: 'fall' })
        }, runTime)

    }
    else{
        ons.notification.toast('Please wait the end of current run', { timeout: 2000, animation: 'fall' })
    }
}

function newRun() {
    document.querySelector('#navigator').pushPage('runId.html', {data: {title: 'New Run !'}});
}

function findFirstChildByClass(id, classN) {
    var doc = document.getElementById(id);
    var find = null;
    for (var i = 0; i < doc.childNodes.length; i++) {
        if (doc.childNodes[i].className.indexOf(classN) != -1) {
            return find = doc.childNodes[i];
        }
    }
}

function httpGet(theUrl) {
    return new Promise((resolve, reject)=> {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                resolve(xmlHttp.responseText);
        }
        xmlHttp.onerror = function () {
            reject("ko");
        };
        xmlHttp.open("GET", theUrl, true);
        xmlHttp.setRequestHeader('Access-Control-Allow-Origin', '*')
        xmlHttp.send(null);
    })
}

async function deleteAll() {
    document.getElementById('dele').setAttribute("disabled", "true");
    var res = await httpGet(`http://${hostPI}:${simuPort}/del`);
    document.getElementById('dele').removeAttribute("disabled");
    ons.notification.toast(res, {
        timeout: 2000
    });
}

async function connectPI() {
    session = enigma.create({
        schema: schemaEnigma,
        url: `ws://${hostPI}:${enginePort}/app/identity/${new Date()}`,
        createSocket: url => new WebSocket(url),
        responseInterceptors: [{
            onRejected: async function retryAbortedError(sessionReference, request, error) {
                return new Promise((resolve, reject)=> {
                    if (countRepeat > 0) {
                        countRepeat = countRepeat - 1;
                        setTimeout(()=> {
                            resolve(request.retry())
                        }, 500)
                    }
                    else {
                        location.reload();
                    }
                })
            },
        }],
    });
    const qix = await session.open();
    const app = await qix.openDoc("bikeR.qvf");
    curApp = app;
    return app;
}

async function paintCompanyList(layout) {
    document.getElementById('cfield').innerHTML = '';
    layout.qListObject.qDataPages[0].qMatrix.map((el)=> {
        var selectionTag = "\"center list-item__center\""
        if (el[0].qState == 'S')
            selectionTag = "\"center list-item__center rselected\"";
        if (el[0].qState == 'X')
            selectionTag = "\"center list-item__center rexcluded\"";
        var newL = `<ons-list-item class="list-item" onclick="selectCompany(${el[0].qElemNumber})">
                     <div style="margin-left: 28px;" class=${selectionTag}>
                        ${el[0].qText}
                    </div>
                </ons-list-item>`
        document.getElementById('cfield').insertAdjacentHTML('beforeend', newL)
    })

}

async function paintList(layout) {
    document.getElementById('rfield').innerHTML = '';
    layout.qListObject.qDataPages[0].qMatrix.map((el)=> {
        var selectionTag = "\"center list-item__center\""
        if (el[0].qState == 'S')
            selectionTag = "\"center list-item__center rselected\"";
        if (el[0].qState == 'X')
            selectionTag = "\"center list-item__center rexcluded\"";
        var newL = `<ons-list-item class="list-item" onclick="selectRider(${el[0].qElemNumber})">
                    <div style="margin-left: 28px;" class=${selectionTag}>
                        ${el[0].qText}
                    </div>
                </ons-list-item>`
        document.getElementById('rfield').insertAdjacentHTML('beforeend', newL)
    })

}

async function paintSelect(layout) {
    var hasSel = layout.qSelectionObject.qSelections.length > 0;
    if(hasSel==true){
        var tot=0;
        layout.qSelectionObject.qSelections.map((sel)=>{
            tot=tot+sel.qSelectedCount;
        })
        //var cp=layout.qSelectionObject.qSelections[0].qSelectedCount;
        document.getElementById("badge").style.display=""
        document.getElementById("badge").innerText=tot>9?tot:"0"+tot;
    }
    else{
        document.getElementById("badge").style.display="none"
    }
    var hasBack = layout.qSelectionObject.qBackCount > 0;
    var hasForw = layout.qSelectionObject.qForwardCount > 0;
    if (document.getElementById('clearBtn') && document.getElementById('backBtn') && document.getElementById('forwBtn')) {
        hasSel ? document.getElementById('clearBtn').classList.remove("dis") : document.getElementById('clearBtn').classList.add("dis");
        hasBack ? document.getElementById('backBtn').classList.remove("dis") : document.getElementById('backBtn').classList.add("dis");
        hasForw ? document.getElementById('forwBtn').classList.remove("dis") : document.getElementById('forwBtn').classList.add("dis");
    } else {
        setTimeout(()=> {
            paintSelect(layout)
        }, 1000)
    }
}

async function paintChart(layout,resize=false) {
    if ((layout && !(JSON.stringify(prevLay) === JSON.stringify(layout)))||(resize && layout)) {
        scatterplot.paintScatterplot(document.getElementById('mychart'), layout,topOnly,scatterModel,getSpeedUnit(),getDistanceUnit());
        prevLay=layout;
    }
}

async function paintLineChart(layout,resize=false) {
    if ((layout && !(JSON.stringify(prevLineLay) === JSON.stringify(layout)))||(resize && layout)) {
        var dif=layout.qHyperCube.qSize.qcy-shownValues
        if(dif>0)
            lineModel.getHyperCubeData('/qHyperCubeDef', [{qTop: dif, qLeft: 0, qHeight: shownValues, qWidth: 3}]).then(function(pages){
                layout.qHyperCube.qDataPages=pages;
                linechart.paintChart(document.getElementById('mychart2'), pages[0].qMatrix,getSpeedUnit());
            });
        else{
            linechart.paintChart(document.getElementById('mychart2'), layout.qHyperCube.qDataPages[0].qMatrix,getSpeedUnit());
        }
        prevLineLay=layout;
    }
}

function paintKpi(layout) {
    var rider1 = 'BEST AVG SPEED:<p class="ita">' + layout.qHyperCube.qDataPages[0].qMatrix[0][1].qText.toUpperCase() + " !!</p>";
    var rider7 = 'BEST TOP SPEED:<p class="ita">' + layout.qHyperCube.qDataPages[0].qMatrix[0][11].qText.toUpperCase() + " !!</p>";

    var rider2 = 'LOWEST AVG HEART RATE:<p class="ita">' + layout.qHyperCube.qDataPages[0].qMatrix[0][3].qText.toUpperCase() + " !!</p>";

    var rider3 = 'BEST AVG POWER:<p class="ita">' + layout.qHyperCube.qDataPages[0].qMatrix[0][5].qText.toUpperCase() + " !!</p>";
    var rider9 = 'BEST TOP POWER:<p class="ita">' + layout.qHyperCube.qDataPages[0].qMatrix[0][15].qText.toUpperCase() + " !!</p>";

    var rider4 = 'BEST AVG CADENCE:<p class="ita">' + layout.qHyperCube.qDataPages[0].qMatrix[0][7].qText.toUpperCase() + " !!</p>";
    var rider8 = 'BEST TOP CADENCE:<p class="ita">' + layout.qHyperCube.qDataPages[0].qMatrix[0][13].qText.toUpperCase() + " !!</p>";
    var rider10 = 'TOTAL<p>DISTANCE</p>';

    var rider5 = 'CSR DONATION<p>1 '+getDistanceUnit()+' = '+getFormatter().format(MONEY_PER_UNIT)+'</p>';
    var rider6 = 'WE SEE HOPE<p>2 '+getDistanceUnit()+' = 1 bike</p>';
    if (document.getElementById('kpirider1').innerHTML.indexOf('LOADING') == -1) {
        if (rider1 != document.getElementById('kpirider1').innerHTML) blinkChange(document.getElementById('mykpi1'));
        if (rider2 != document.getElementById('kpirider2').innerHTML) blinkChange(document.getElementById('mykpi2'));
        //if (rider3 != document.getElementById('kpirider3').innerHTML) blinkChange(document.getElementById('mykpi3'));
        if (rider4 != document.getElementById('kpirider4').innerHTML) blinkChange(document.getElementById('mykpi4'));
        if (rider7 != document.getElementById('kpirider7').innerHTML) blinkChange(document.getElementById('mykpi7'));
        if (rider8 != document.getElementById('kpirider8').innerHTML) blinkChange(document.getElementById('mykpi8'));
        //if (rider9 != document.getElementById('kpirider9').innerHTML) blinkChange(document.getElementById('mykpi9'));
        if (layout.qHyperCube.qDataPages[0].qMatrix[0][9].qNum.toFixed(2) != document.getElementById('kpi5').innerHTML) blinkChange(document.getElementById('mykpi5'));
        if (layout.qHyperCube.qDataPages[0].qMatrix[0][8].qNum != document.getElementById('kpi6').innerHTML) {blinkChange(document.getElementById('mykpi6'));ding()};
    }
    document.getElementById('kpi1').innerHTML = layout.qHyperCube.qDataPages[0].qMatrix[0][0].qNum.toFixed(2);
    document.getElementById('kpirider1').innerHTML = rider1;
    document.getElementById('kpi2').innerHTML = layout.qHyperCube.qDataPages[0].qMatrix[0][2].qNum.toFixed(2);
    document.getElementById('kpirider2').innerHTML = rider2;
    //document.getElementById('kpi3').innerHTML = layout.qHyperCube.qDataPages[0].qMatrix[0][4].qNum.toFixed(2);
    //document.getElementById('kpirider3').innerHTML = rider3;
    document.getElementById('kpi4').innerHTML = layout.qHyperCube.qDataPages[0].qMatrix[0][6].qNum.toFixed(2);
    document.getElementById('kpirider4').innerHTML = rider4;
    document.getElementById('kpi5').innerHTML = getFormatter().format(layout.qHyperCube.qDataPages[0].qMatrix[0][9].qNum);
    document.getElementById('kpirider5').innerHTML = rider5;
    document.getElementById('kpi6').innerHTML = layout.qHyperCube.qDataPages[0].qMatrix[0][8].qNum;
    document.getElementById('kpirider6').innerHTML = rider6;
    document.getElementById('kpi7').innerHTML = layout.qHyperCube.qDataPages[0].qMatrix[0][10].qNum.toFixed(2);
    document.getElementById('kpirider7').innerHTML = rider7;
    document.getElementById('kpi8').innerHTML = layout.qHyperCube.qDataPages[0].qMatrix[0][12].qNum.toFixed(2);
    document.getElementById('kpirider8').innerHTML = rider8;
    //document.getElementById('kpi9').innerHTML = layout.qHyperCube.qDataPages[0].qMatrix[0][14].qNum.toFixed(2);
    //document.getElementById('kpirider9').innerHTML = rider9;
    document.getElementById('kpi10').innerHTML = layout.qHyperCube.qDataPages[0].qMatrix[0][16].qNum.toFixed(2);
    document.getElementById('kpirider10').innerHTML = rider10;
}

function topVis(){
    var ck = document.getElementById('check-2');
    topOnly=ck.checked;
    if(ck.checked)
        patchTop5();
    else
        patchDim();
    Scatterplot.cached=[];
}

function blinkChange(el) {
    el.classList.add("blink");
    blInt = setTimeout(()=> {
        el.classList.remove("blink");
    }, 1500)
}

function createMySelection(app) {
    const properties = {
        qInfo: {
            qType: 'SessionLists',
        },
        qSelectionObjectDef: {}
    };
    app.createSessionObject(properties).then((model) => {
        var object = model;

        const update = () => object.getLayout().then((layout) => {
            paintSelect(layout);
        });

        object.on('changed', update);
        update();
    });
}

function createMyCompanyList(app) {
    const properties = {
        qInfo: {
            qType: 'my-list-object',
            id:"companyList"
        },
        qListObjectDef: {
            qDef: {
                qFieldDefs: ['Company'],
                qSortCriterias: [{qSortByState:1,qSortByAscii:1}],
            },
            qShowAlternatives: true,
            qInitialDataFetch: [{
                qTop: 0,
                qHeight: 500,
                qLeft: 0,
                qWidth: 1,
            }],
        },
    };
    app.createSessionObject(properties).then((model) => {
        var object = model;

        const update = () => object.getLayout().then((layout) => {
            paintCompanyList(layout);
        });

        object.on('changed', update);
        update();
    });
}

function createMyList(app) {
    const properties = {
        qInfo: {
            qType: 'my-list-object2',
            id:"riderList"
        },
        qListObjectDef: {
            qDef: {
                qFieldDefs: ['RiderID'],
                qSortCriterias: [{qSortByState:1,qSortByAscii:1}],
            },
            qShowAlternatives: true,
            qInitialDataFetch: [{
                qTop: 0,
                qHeight: 500,
                qLeft: 0,
                qWidth: 1,
            }],
        },
    };
    app.createSessionObject(properties).then((model) => {
        var object = model;

        const update = () => object.getLayout().then((layout) => {
            paintList(layout);
        });

        object.on('changed', update);
        update();
    });
}

function createMyKpi(app) {
    app.createSessionObject(kpiProps()).then((model) => {
        var object = model;

        const update = () => object.getLayout().then((layout) => {
            paintKpi(layout);
        });

        object.on('changed', update);
        update();
    });
}

function createMyChart(app) {
    app.createSessionObject(scatterProps()).then((model) => {
        scatterModel=model;
        var object = model;

        const update = () => object.getLayout().then((layout) => {
            curLay = layout;
            paintChart(layout);
            resize();
        });

        object.on('changed', update);
        update();
    });
}

function createMyLineChart(app) {
    app.createSessionObject(lineProps()).then((model) => {
        lineModel=model;
        var object = model;

        const update = () => object.getLayout().then((layout) => {
            curLineLay = layout;
            paintLineChart(layout)
        });

        object.on('changed', update);
        update();
    });
}

function setUnitInUI(){
    var x = document.getElementsByClassName("speedUnit");
    var i;
    for (i = 0; i < x.length; i++) {
        x[i].innerText = getSpeedUnit();;
    }
    var y = document.getElementsByClassName("distanceUnit");
    var j;
    for (j = 0; j < y.length; j++) {
        y[j].innerText = getDistanceUnit();
    }
}
function getSpeedUnit(){
    if(SPEED_UNIT=="K")
        return "Km/h"
    return "Mph";
}
function getDistanceUnit(){
    if(SPEED_UNIT=="K")
        return "Km."
    return "Mi."
}
function inUnitperHour(){
    if(SPEED_UNIT=="K")
        return 3.600;
    return mInMile*3600;
}

function inUnit(){
    if(SPEED_UNIT=="K")
        return 0.001
    return mInMile;
}

function kpiProps() {
    return props = {
        qInfo: {
            qType: 'visualization',
            qId: '1',
        },
        type: 'my-kpi',
        labels: true,
        qHyperCubeDef: {
            qDimensions: [],
            qMeasures: [
                {
                    qDef: {
                        qDef: `=max(DISTINCT Aggr(avg([Speed]*${inUnitperHour()}),RiderID))`,
                        qLabel: 'max speed',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },
                {
                    qDef: {
                        qDef: '=FirstSortedValue(DISTINCT RiderID, -aggr( Avg([Speed]), RiderID) )',
                        qLabel: 'max speed rider',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },
                {
                    qDef: {
                        qDef: '=min(DISTINCT Aggr(avg(HeartRate),RiderID))',
                        qLabel: 'min HeartRate',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },
                {
                    qDef: {
                        qDef: '=FirstSortedValue(DISTINCT RiderID, aggr( Avg([HeartRate]), RiderID) )',
                        qLabel: 'min HeartRate rider',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },
                {
                    qDef: {
                        qDef: '=max(DISTINCT Aggr(avg([Power Watts]),RiderID))',
                        qLabel: 'max power',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },
                {
                    qDef: {
                        qDef: '=FirstSortedValue(DISTINCT RiderID, aggr( Avg([Power Watts]), RiderID) )',
                        qLabel: 'max power rider',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },
                {
                    qDef: {
                        qDef: '=max(DISTINCT Aggr(avg([Cadence]),RiderID))',
                        qLabel: 'max cadence',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },
                {
                    qDef: {//concat({<[Cadence]={'$(=Avg([Cadence]))'} >} distinct RiderID, ', ')
                        qDef: '=FirstSortedValue(DISTINCT RiderID, -aggr( Avg([Cadence]), RiderID) )',
                        qLabel: 'max cadence rider',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },
                {//TODO
                    qDef: {
                        qDef: `=Floor(Sum( [Distance]*${inUnit()}/100 *${MONEY_PER_UNIT} ))`,
                        qLabel: 'Bike donated',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },
                {//TODO
                    qDef: {
                        qDef:`=Sum( [Distance]*${inUnit()}*${MONEY_PER_UNIT} )`,
                        //qDef: `=sum( { 1 } [Distance]*${mInMile}*150)`,
                        qLabel: 'Money donated',
                    },
                    qSortBy: {
                        qSortByNumeric: -1,
                    }
                },//TOP SPEED
                {
                    qDef: {
                        qDef: `=max([Speed]*${inUnitperHour()})`,
                        qLabel: 'top speed',
                    },
                    qSortBy: {
                        qSortByNumeric: 1,
                    }
                },
                {
                    qDef: {
                        qDef: '=FirstSortedValue( DISTINCT RiderID, -aggr( max([Speed]) , RiderID) )',
                        qLabel: 'max speed rider',
                    },
                    qSortBy: {
                        qSortByNumeric: 1,
                    }
                }, //TOP CADENCE
                {
                    qDef: {
                        qDef: '=max([Cadence])',
                        qLabel: 'top cadence',
                    },
                    qSortBy: {
                        qSortByNumeric: 1,
                    }
                },
                {
                    qDef: {
                        qDef: '=FirstSortedValue( DISTINCT RiderID, -aggr( max([Cadence]) , RiderID) )',
                        qLabel: 'max speed rider',
                    },
                    qSortBy: {
                        qSortByNumeric: 1,
                    }
                },//TOP POWER
                {
                    qDef: {
                        qDef: '=max([Power Watts])',
                        qLabel: 'top cadence',
                    },
                    qSortBy: {
                        qSortByNumeric: 1,
                    }
                },
                {
                    qDef: {
                        qDef: '=FirstSortedValue(DISTINCT RiderID, -aggr( max([Power Watts]) , RiderID) )',
                        qLabel: 'max speed rider',
                    },
                    qSortBy: {
                        qSortByNumeric: 1,
                    }
                },
                {
                    qDef: {
                        qDef: `=sum(Distance)*${inUnit()}`,
                        qLabel: 'total distance',
                    },
                    qSortBy: {
                        qSortByNumeric: 1,
                    }
                }

            ],
            qInitialDataFetch: [{
                qTop: 0, qHeight: 20, qLeft: 0, qWidth: 17,
            }],
            qSuppressZero: false,
            qSuppressMissing: true,
        },
    };
}

function scatterProps() {
    return scatterplotProperties = {
        qInfo: {
            qType: 'visualization',
            qId: '1',
        },
        type: 'my-picasso-scatterplot',
        labels: true,
        qHyperCubeDef: {
            qDimensions: [{
                qDef: {
                    //qFieldDefs: [`=AGGR( IF( (Rank(sum(Distance))<=5), [Rank] & ' - ' & RiderID),RiderID)` ],
                    qFieldDefs: [`=AGGR([Rank] & ' - ' & RiderID,RiderID)` ],
                    //qFieldDefs:['RiderID'],
                    qSortCriterias: [{
                        qSortByAscii: 1,
                    }],
                },
                "qNullSuppression":true,
            }],
            qMeasures: [{
                qDef: {
                    qDef: `=max([Speed]*${inUnitperHour()})`,
                    //qDef: `=avg([Speed])`,
                    qLabel: 'Max Speed Rate',
                },
                qSortBy: {
                    qSortByNumeric: -1,
                },
            },
                {
                    qDef: {
                        qDef: `=sum([Distance]*${inUnit()})`,
                        //qDef: `=sum([Distance])`,
                        qLabel: 'Total Distance',
                    },
                }],
            qInitialDataFetch: [{
                qTop: 0, qHeight: 2000, qLeft: 0, qWidth: 3,
            }],
            qSuppressZero: false,
            qSuppressMissing: true,
        },
    };
}

function lineProps() {
    return lineProperties = {
        qInfo: {
            qType: 'visualization',
            qId: '234',
        },
        type: 'my-picasso-multiax',
        labels: true,
        qHyperCubeDef: {
            qDimensions: [{
                qDef: {
                    qGrouping: "N",
                    qFieldDefs: ['[TimeStamp]']
                    //qFieldDefs: [`=IF(Match(RiderID, 'J'),TimeStamp)`]
                },
                "qNullSuppression":true,
            }],
            qMeasures: [
                {
                    qDef: {
                        qDef:`=max( [Speed]*${inUnitperHour()} )`,
                        //qDef: `=max(Speed)*(${mInMile}*3600)`,
                        qLabel: 'Max Speed',
                    },
                    qSortBy: {
                        qSortByNumeric: 1,
                    }
                },
                {
                    qDef: {
                        qDef:`=max( [Cadence] )`,
                        //qDef: `=max(Cadence)`,
                        qLabel: 'Max Cadence',
                    },
                    qSortBy: {
                        qSortByNumeric: 1,
                    }
                }

            ],
            qInitialDataFetch: [{
                qTop: 0, qHeight: 600, qLeft: 0, qWidth: 3,
            }],
            qSuppressZero: false,
            qSuppressMissing: true,
        },
    };
}

async function selectCompany(id) {
    if (curApp) {
        var field = await curApp.getField('Company');
        field.lowLevelSelect([id], true, false)
        //document.getElementById("cfield").scrollTop = 0
    }
}

async function selectRider(id) {
    if (curApp) {
        var field = await curApp.getField('RiderID');
        field.lowLevelSelect([id], true, false);
        //document.getElementById("rfield").scrollTop = 0
    }
}

function openDetails(id) {
    curRider = document.querySelector('#' + id + "_name").innerHTML;
    document.querySelector('#navigator').pushPage('details.html');
}

function openMenu() {
    document.getElementById('appSplitter').left.toggle().then(()=>{},()=>{
        console.log("REJECTED");
        setTimeout(()=>{
            document.getElementById('appSplitter').left.toggle();
        },500)
    });
}

function clearAll() {
    curApp.clearAll();
}

function back() {
    curApp.back();
}

function next() {
    curApp.forward();
}

function dynKey() {
    if (CSS && CSS.supports && CSS.supports('animation: name')) {
        addKeyFrames = function (name, frames) {
            for (var rule of myReuseableStylesheet.sheet.cssRules) {
                if (rule.name === name) {
                    myReuseableStylesheet.sheet.removeRule(rule.name);
                    //console.log(rule.cssText,"FRAME : "+frames);
                }
            }
            var pos = myReuseableStylesheet.sheet.cssRules.length;
            var id = myReuseableStylesheet.sheet.insertRule(
                "@keyframes " + name + "{" + frames + "}", pos);
        }
    } else {
        addKeyFrames = function (name, frames) {
            var str = name + "{" + frames + "}",
                pos = myReuseableStylesheet.length;
            myReuseableStylesheet.sheet.insertRule("@-webkit-keyframes " + str, pos);
            myReuseableStylesheet.sheet.insertRule("@keyframes " + str, pos + 1);
        }
    }
}



function gauge(trg,max,lab,pctcol){
    var opts = {
        angle: -0.33, // The span of the gauge arc
        lineWidth: 0.11, // The line thickness
        radiusScale: 0.95, // Relative radius
        pointer: {
            length: 0.6, // // Relative to gauge radius
            strokeWidth: 0.053, // The thickness
            color: 'darkGrey' // Fill color
        },
        staticLabels: {
            font: "10px sans-serif",  // Specifies font
            labels: lab,  // Print labels at these values
            color: "#FFFFFF",  // Optional: Label text color
            fractionDigits: 0  // Optional: Numerical precision. 0=round off.
        },
        limitMax: false,     // If false, max value increases automatically if value > maxValue
        limitMin: true,     // If true, the min value of the gauge will be fixed
        colorStart: 'white',   // Colors
        colorStop: 'red',    // just experiment with them
        strokeColor: 'white',  // to see which ones work best for you
        generateGradient: true,
        percentColors: pctcol,
        highDpiSupport: true,     // High resolution support
        renderTicks: {
            divisions: 5,
            divWidth: 1.1,
            divLength: 0.7,
            divColor: "#333333",
            subDivisions: 3,
            subLength: 0.5,
            subWidth: 0.6,
            subColor: "#666666"
        }

    };
    var target = document.getElementById(trg); // your canvas element
    var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
    gauge.maxValue = max; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.animationSpeed = 90; // set animation speed (32 is default value)
    gauge.set(max); // set actual value
    return gauge;
}
function setRunState(state){
    if(document.getElementById('strun') && state){
        document.getElementById('strun').setAttribute("disabled", state);
        document.getElementById('strun').textContent="Speed not detected"
    }
    if(document.getElementById('strun') && !state){
        document.getElementById('strun').removeAttribute("disabled");
        document.getElementById('strun').textContent="RUN !!";
    }
}

async function init() {
    try {
        var app = await connectPI();
        createMyLineChart(app);
        createMyChart(app);
        createMyList(app);
        createMyCompanyList(app);
        createMySelection(app);
        createMyKpi(app);
        resize();
        dynKey();
        liveSpeed=gauge("liveSpeed",40,[0, 10, 15, 20, 25, 30,35,40],[[0.0, "#a9d70b" ], [0.40, "#f9c802"], [1.0, "#ff0000"]]);
        if(SPEED_UNIT=="K")
            liveSpeed=gauge("liveSpeed",90,[0, 10, 15, 20, 25, 30,35,40,50,60,70,80],[[0.0, "#a9d70b" ], [0.60, "#f9c802"], [1.0, "#ff0000"]]);
        liveCadence=gauge("liveCadence",200,[0,40,80,120,160,200],[[0.0, "#a9d70b" ], [0.10, "#f9c802"], [0.7, "#ff0000"]]);
        setUnitInUI();
        setInterval(async ()=> {
            try {
                var res = JSON.parse(await httpGet(`http://${hostPI}:${simuPort}/stat`));
                res.speed=='None'?res.speed=0:""
                if(res.speed==0)setRunState(true); else setRunState(false);
                res.cadence=='None'?res.cadence=0:""
                res.cadence<0?res.cadence=0:"";
                //document.getElementById('kpi6').innerHTML =res.hr;
                var speed=(parseFloat(res.speed) * inUnitperHour()).toFixed(0);
                var cadence=parseFloat(res.cadence).toFixed(0);
                liveSpeed.set(speed);liveCadence.set(cadence);liveCadenceText
                document.getElementById('liveCadenceText').innerText=cadence+" Rpm";document.getElementById('liveSpeedText').innerText=speed+" "+getSpeedUnit();
                document.getElementById('freem').innerHTML = 'Session/Mem: ' + res.session.total + " / " + res.mem.committed.toFixed(2);
                //if(res.curBikerName && res.isBiking==true){
                //    Scatterplot.current=res.curBikerName;
                //    patchRun(res.curBikerName)
                //}
            }
            catch (err) {
                countError--;
                //if(countError<0)
                //  location.reload();
            }
        }, 1000)
    }
    catch (er) {
        setTimeout(()=> {
            //location.reload();
        }, 3000)
    }
}

function resize() {
    var body = document.body,
        html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
    var width = Math.max(body.scrollWidth, body.offsetWidth,
        html.clientWidth, html.scrollWidth, html.offsetWidth);
    if(width<500){
        document.getElementById("stats").style.display='none'
    }else{
        document.getElementById("stats").style.display='';
    }
    if (height > 380) {
        document.getElementById("mychart").style.height = ((height - 280)/10)*7 + 'px'
        document.getElementById("mychart2").style.height = ((height - 280)/10)*3 + 'px'
    }
    else {
        document.getElementById("mychart").style.height = '300px'
    }
    paintChart(curLay,true)
    paintLineChart(curLineLay,true)

}

function scrollUp(){
    for(var i=0;i<10;i++){
        scatterplot.pic.component('leg').emit('prev');
    }
}

function scrollDown(){
    for(var i=0;i<10;i++){
        scatterplot.pic.component('leg').emit('next');
    }

}
window.onresize = resize;
init();



