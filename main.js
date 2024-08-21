

function GetCfg() {
    const cfg = {};
    if (document.getElementById("IsSnapEnable").checked) {
        cfg.snap = { threshold: Number(document.getElementById("SnapThreshold").value) };
    }
    if (document.getElementById("IsSimpEnable").checked) {
        cfg.simp = { digit: Number(document.getElementById("SimpDigit").value) };
    }
    if (document.getElementById("IsLinecapEnable").checked) {
        cfg.linecap = { cap: Number(document.getElementById("LinecapType").value) };
    }
    if (document.getElementById("IsLinejoinEnable").checked) {
        cfg.linejoin = { join: Number(document.getElementById("LinejoinType").value) };
    }
    return cfg;
}

function OnClickSnapSvg() {
    document.getElementById("Error").style.display = "none";
    const cfg = GetCfg();
    const file = document.getElementById("SVGFile").files[0];
    if (!file) { return; }
    document.getElementById("Loading").style.display = "block";

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const svg = e.target.result;
            // 处理单张 svg 文件，这里调用了 convertSvg
            const newSvg = scsvgsnap.convertSvg(svg, cfg);
            const blob = new Blob([newSvg], { type: 'image/svg+xml' });
            saveAs(blob, file.name);
        } catch(error) {
            const e = document.getElementById("Error");
            e.style.display = "block";
            e.innerHTML = error.message;
        } finally {
            document.getElementById("Loading").style.display = "none";
        }
    };
    reader.readAsText(file);
}



/*function HandleSvgInSb3(sb3, pj) {
    scsvgsnap.forEachCostume(pj, function(cos) {
        if (cos.dataFormat != "svg") { return; }
        sb3.file(cos.md5ext).async("text").then(function(svg) {
            // 处理 sb3 中的 svg 文件，这里调用了 convertSvg
            const newSvg = scsvgsnap.convertSvg(svg);
            sb3.file(cos.md5ext, newSvg);
        });
    });
}*/
// 下面是由 ai 修改过的函数
function HandleSnapSb3(sb3, pj, file, cfg) {
    scsvgsnap.forEachCostume(pj, function(cos, sprite, resolve, reject) {
        if (cos.dataFormat != "svg") {
            resolve(); // 如果不是 svg，‌直接解决 Promise
            return;
        }
        sb3.file(cos.md5ext).async("text").then(function(svg) {
            // 处理 sb3 中的 svg 文件
            const newSvg = scsvgsnap.convertSvg(svg, cfg);
            const svgUrl = cos.md5ext || cos.assetId + ".svg";
            sb3.file(svgUrl, newSvg);
            resolve(); // 异步操作完成后解决 Promise
        }).catch(reject); // 捕获错误并拒绝 Promise
    }).then(() => {
        // 处理完成
        sb3.generateAsync({ type: 'blob' }).then(function(blob) {
            saveAs(blob, file.name);
        });
    }).catch((error) => {
        console.error('处理 SVG 文件时发生错误:', error);
        const e = document.getElementById("Error");
        e.style.display = "block";
        e.innerHTML = error.message;
    }).finally(() => {
        document.getElementById("Loading").style.display = "none";
    })
}

function OnClickSnapSb3() {
    document.getElementById("Error").style.display = "none";
    const cfg = GetCfg();
    const file = document.getElementById("SB3File").files[0];
    if (!file) { return; }
    document.getElementById("Loading").style.display = "block";

    const reader = new FileReader();
    reader.onload = function(evt) {
        const arrayBuffer = evt.target.result;
        JSZip.loadAsync(arrayBuffer).then(function(sb3) {
            sb3.file("project.json").async("text").then(function(pj) {
                HandleSnapSb3(sb3, pj, file, cfg);
            });
        });
    }
    reader.readAsArrayBuffer(file);
}

