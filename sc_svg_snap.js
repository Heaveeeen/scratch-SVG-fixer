
const scsvgsnap = {

    // 将x四舍五入并保留y位小数
    round: function(x, y = 5) {
        const n = Math.pow(10, y);
        return Math.round(x * n) / n
    },


    // 解析一个 svg path 代码并将其转换为由 M, c, l, z 指令组成的Array
    // !!! 仅支持由 scratch 造型编辑器生成的图像 !!!
    parsePath: function(code) {
        let res = [];
        let cmd = ["M"];
        let arg = "";
        
        for (let i = 1; i < code.length; i++) {
            const c = code[i];
            if (c == "z" || c == "c" || c == "l" || c == "v" || c == "h") {
                if (arg.length > 0) {
                    // 完成上一个参数
                    cmd.push(Number(arg));
                    arg = "";
                }
                if (cmd.length > 0) {
                    // 完成上一个指令
                    res.push(cmd);
                    cmd = [c];
                }
            } else if (c == "," || c == " ") {
                if (arg.length > 0) {
                    // 完成上一个参数
                    cmd.push(Number(arg));
                    arg = "";
                }
            } else {
                // 连接字符串组成参数
                arg += c;
            }
        }
        if (arg.length > 0) isNaN(arg) ? cmd.push(arg) : cmd.push(Number(arg));
        if (cmd.length > 0) res.push(cmd);

        return res;
    },


    // 根据 parsePath() 解析出来的 path 计算该路径的终点与起点之差
    // 可用于计算路径是否会产生重合点
    sumPath: function(path) {
        let x = 0;
        let y = 0;

        for (let i = 0; i < path.length; i++) {
            switch (path[i][0]) {
                case "M", "z":
                    break;
                case "l":
                    x += path[i][1];
                    y += path[i][2];
                    break;
                case "h":
                    x += path[i][1];
                    break;
                case "v":
                    y += path[i][1];
                    break;
                case "c":
                    x += path[i][5];
                    y += path[i][6];
                    break;
            }
        }

        return {x: x, y: y}
    },


    // 输入一个由 parsePath() 解析出来的 path
    // 如果一个路径有重合点，则返回 false
    isSnaped: function(path, threshold = 0.02) {
        const {x, y} = this.sumPath(path);
        return ((x == 0 && y == 0) || 
            (Math.sqrt(x * x + y * y) >= threshold)) ||
            path[path.length - 1][0] != "z";
    },


    // 去除一个路径中的重合点
    snap: function(path, threshold = 0.02) {
        if (this.isSnaped(path, threshold)) return path;

        const cmd = path[path.length - 2];
        const {x, y} = this.sumPath(path);

        switch (cmd[0]) {
            case "l":
                cmd[1] = this.round(cmd[1] - x);
                cmd[2] = this.round(cmd[2] - y);
                break;
            case "c":
                if (cmd[3] == cmd[5] && cmd[4] == cmd[6]) {
                    cmd[3] = this.round(cmd[3] - x);
                    cmd[4] = this.round(cmd[4] - y);
                }
                cmd[5] = this.round(cmd[5] - x);
                cmd[6] = this.round(cmd[6] - y);
                break;
        }

        return path;
    },


    // 为一个路径中的所有数值取整
    simp: function(path, digit = 2) {
        for (i = 0; i < path.length; i++) {
            const cmd = path[i];
            for (j = 0; j < cmd.length; j++) {
                if (!isNaN(cmd[j])) {
                    cmd[j] = this.round(cmd[j], digit);
                }
            }
        }
    },


    // 将一个解析过的 path 转换回字符串
    dumpPath: function(path) {
        let res = "";
        let cmd = "";
        
        for (i = 0; i < path.length; i++) {
            for (j = 0; j < path[i].length; j++) {
                cmd += path[i][j] + " ";
            }
            res += cmd.trimEnd();
            cmd = "";
        }

        return res;
    },


    // 输入一个字符串形式的 svg path
    // 对其调用 snap 并输出字符串形式的结果
    snapByPathCode: function(pathcode, threshold = 0.02) {
        const p = this.parsePath(pathcode);
        this.snap(p, threshold);
        const res = this.dumpPath(p)
        return res;
    },


    // 输入一个字符串形式的 svg path
    // 对其调用 simp 并输出字符串形式的结果
    simpByPathCode: function(pathcode, digit = 2) {
        const p = this.parsePath(pathcode);
        this.simp(p, digit);
        const res = this.dumpPath(p)
        return res;
    },


    // 改变一张 svg 中所有 path 的 stroke-linecap
    linecap: function(svg, cap) {
        const newSvg = svg.replace(/(?<=stroke-linecap=")([^"]*)(?=")/g, cap);
        return newSvg;
    },


    // 改变一张 svg 的 stroke-linejoin
    linejoin: function(svg, join) {
        const newSvg = svg.replace(/(?<=stroke-linejoin=")([^"]*)(?=")/g, join);
        return newSvg;
    },


    // 输入一张 svg 的源码
    // 输出处理过的 svg 源码
    convertSvg: function(svg, cfg) {
        // -- dated --
        //let res = svg.replace(/(?<=<path d="[^"]*)([^"]+)(?=[^"]*")/g, (match) => this.snapByCode(match));
        //let res = svg.replace(/M([^z"]+)z*/g, (match) => this.snapByPathCode(match));
        // -- dated --

        let res = "";

        if (cfg.snap || cfg.simp) {
            res = svg.replace(/(?<=(?:<path d=)*"[Mz\d\-\.clvh ,]*)M([\d\-\.clvh ,]+)z*/g, (match) => {
                const p = this.parsePath(match);
                // 去除重合点
                if (cfg.snap) {
                    const thr = cfg.snap.threshold;
                    if (0 < thr && thr < 1) {
                        this.snap(p, thr);
                    } else {
                        this.snap(p);
                    }
                }
                // 取整
                if (cfg.simp) {
                    const dig = cfg.simp.digit;
                    if (0 <= dig && dig <= 4) {
                        this.simp(p, dig);
                    } else {
                        this.simp(p)
                    }
                }
                const newPath = this.dumpPath(p)
                return newPath;
            });
        } else {
            res = svg;
        }

        // linecap
        if (cfg.linecap) {
            const cap = cfg.linecap.cap;
            const caps = ["butt", "round", "square"/*, "inherit"*/];
            if (caps[cap]) {
                res = this.linecap(res, caps[cap]);
            }
        }

        // linejoin
        if (cfg.linejoin) {
            const join = cfg.linejoin.join;
            const joins = ["miter", "round", "bevel"/*, "inherit"*/];
            if (joins[join]) {
                res = this.linejoin(res, joins[join]);
            }
        }

        return res;
    },


    // 输入 project.json 的文本内容
    // 为每个造型都调用一次 callback(costume, sprite)
    // costume 是一个对象，像这样：
    /*{
        "name": "sun//3_hover",
        "bitmapResolution": 1,
        "dataFormat": "svg",
        "assetId": "aed46a1516e384bf7ee040e5bab454cd",
        "md5ext": "aed46a1516e384bf7ee040e5bab454cd.svg",
        "rotationCenterX": 47.98249058897554,
        "rotationCenterY": 47.98249058897562
    }*/
    // sprite 是这个 costume 所属的 sprite，也是一个对象，具体请参考 project.json
    /*forEachCostume: function(json, callback) {
        let pj = JSON.parse(json);
        let sprites = pj.targets;
        for (let i = 0; i < sprites.length; i++) {
            let costumes = sprites[i].costumes;
            for (let j = 0; j < costumes.length; j++) {
                callback(costumes[j], sprites[i]);
            }
        }
    }*/
    // 这个是 ai 修改过的版本，但我不懂异步……
    forEachCostume: function(json, callback) {
        const pj = JSON.parse(json);
        const sprites = pj.targets;
        const promises = []; // 存储所有的 Promise

        for (let i = 0; i < sprites.length; i++) {
          const costumes = sprites[i].costumes;
          for (let j = 0; j < costumes.length; j++) {
            // 将回调函数的调用包装成一个 Promise，‌并添加到 promises 数组中
            promises.push(new Promise((resolve, reject) => {
              callback(costumes[j], sprites[i], resolve, reject);
            }));
          }
        }
      
        return Promise.all(promises); // 返回 Promise.all，‌以便等待所有 Promise 完成
      },

}