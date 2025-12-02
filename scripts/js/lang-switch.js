/* ----------------------------------------------------------------------------
　言語変換スクリプト
---------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function() {
    const langSwitch = document.getElementById("languageSelector");

    langSwitch.addEventListener("change", function() {
        const lang = langSwitch.value;

        switch (lang) {
            case "en":
                document.getElementById("pop").textContent = "Population";
                document.getElementById("pop-country").textContent = "Countries";
                document.getElementById("pop-city").textContent = "Cities";
                document.getElementById("emp").textContent = "Employment";
                break;
            case "ja":
                document.getElementById("pop").textContent = "人口";
                document.getElementById("pop-country").textContent = "国別";
                document.getElementById("pop-city").textContent = "都市別";
                document.getElementById("emp").textContent = "従業者数";
                break;
        }
    });
});
