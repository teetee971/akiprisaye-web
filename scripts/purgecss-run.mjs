import fs from "fs";

console.log("✂️ PurgeCSS simulé (mode simple).");

let css = fs.readFileSync("./style.css", "utf8");

css = css.replace(/\/\*.*?\*\//gs, ""); // supprime commentaires

fs.writeFileSync("./style.css", css);

console.log("✔ CSS nettoyé.");
