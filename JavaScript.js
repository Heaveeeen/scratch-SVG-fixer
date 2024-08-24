document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("SVGFile").addEventListener("change", function (event) {
        var fileInput = event.target;
        var fileName = fileInput.files[0].name;

        console.log("Selected file name:", fileName);

        var pattern = /^.+[.]sb3|Sb3|SB3$/g
        var str = fileName
        var str2 = str.replace(pattern, "\\$&");
        console.log(str2)
        if (str2 === "") {
            handleFileSelection(fileName, "sb3233");

        } else {
            handleFileSelection(fileName, "svg233");
        }

    });
});
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("SB3File").addEventListener("change", function (event) {
        var fileInput = event.target;
        var fileName = fileInput.files[0].name;

        console.log("Selected file name:", fileName);

        var pattern = /^.+[.]sb3|Sb3|SB3$/g
        var str = fileName
        var str2 = str.replace(pattern, "\\$&");
        console.log(str2)
        if (str2 === "") {
            

        } else {
            handleFileSelection(fileName, "sb3233");
        }

    });
});


function handleFileSelection(fileName, id) {
    console.log("Handling file:", fileName);
    document.getElementById(id).innerText = "上传的文件：" + fileName
}
