const searchCache = {}; // Cache für die Cocktail-Suche
const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

let allCocktailsCache = []; // Cache für alle Cocktails
let currentCocktails = [];  // Liste der Cocktails, die aktuell angezeigt werden

const loadingScreen = document.getElementById('loadingScreen');
const resultsSection = document.getElementById('resultsSection');

// Initially hide the results section
resultsSection.style.opacity = '0';

// Am Anfang der Datei nach den Variablen-Deklarationen
const customAlert = document.getElementById('customAlert');
const alertMessage = customAlert.querySelector('.alert-message');
const alertClose = customAlert.querySelector('.alert-close');

class Cocktail {
    
    constructor(id, name, image, category, alcohol_content, glass) {
        this.idDrink = id; 
        this.strDrink = name;
        this.strDrinkThumb = image;
        this.ingredients = [];
        this.strCategory = category;
        this.strAlcoholic = alcohol_content;
        this.strGlass = glass;
    }

    getIngredients() {
        return this.ingredients;
    }
}

async function loadCocktailsByAlphabet() {
    // Show loading screen
    loadingScreen.classList.remove('hidden');
    
    for (const letter of alphabet) {
        const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`;
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.drinks) {
                data.drinks.forEach(cocktail => {
                    const newCocktail = new Cocktail(
                        cocktail.idDrink,
                        cocktail.strDrink,
                        cocktail.strDrinkThumb, 
                        cocktail.strCategory,
                        cocktail.strAlcoholic,
                        cocktail.strGlass
                    );
                    for(let i = 1; i <= 15; i++) {  
                        const ingredient = cocktail[`strIngredient${i}`];
                        if (ingredient) {
                            newCocktail.ingredients.push(ingredient.toLowerCase());
                        }
                    }   
                    allCocktailsCache.push(newCocktail);
                });
            }
        } catch (error) {
            console.error(`Fehler beim Abrufen der Cocktails für Buchstabe ${letter}:`, error);
        }    
    }
    
    // Add a small delay to ensure smooth transition
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Hide loading screen and show content
    loadingScreen.classList.add('hidden');
    resultsSection.style.opacity = '1';
    resultsSection.style.transition = 'opacity 0.5s ease-in';
    
    console.log("Alle Cocktails erfolgreich geladen:", allCocktailsCache);
}

// Funktion zum Anzeigen des Alerts
function showAlert(message, duration = 3000) {
    alertMessage.textContent = message;
    customAlert.classList.add('show');
    
    // Automatisches Ausblenden nach der angegebenen Zeit
    setTimeout(() => {
        customAlert.classList.remove('show');
    }, duration);
}

// Event Listener für den Close-Button
alertClose.addEventListener('click', () => {
    customAlert.classList.remove('show');
});

async function searchCocktailsByIngredient(ingredients) {
    loadingScreen.classList.remove('hidden');
    currentCocktails = [];

    if (!ingredients) {
        showAlert("Bitte geben Sie eine oder mehrere Zutaten ein.");
        loadingScreen.classList.add('hidden');
        return;
    }

    const ingredientList = ingredients
        .split(',')
        .map(i => i.trim().toLowerCase())
        .filter(i => i.length > 0);

    if (ingredientList.length === 0) {
        showAlert("Bitte geben Sie mindestens eine gültige Zutat ein.");
        loadingScreen.classList.add('hidden');
        return;
    }

    ingredientList.forEach(ingredient => {
        let cacheKey = `ingredient:${ingredient}`;
        let filteredCocktails = [];

        if (searchCache[cacheKey]) {
            console.log("Cocktails aus dem Cache geholt:");
            filteredCocktails = searchCache[cacheKey];
        } else {
            filteredCocktails = allCocktailsCache.filter(cocktail =>
                cocktail.ingredients.includes(ingredient)
            );
            console.log(filteredCocktails);
            searchCache[cacheKey] = filteredCocktails;
        }
        currentCocktails = currentCocktails.concat(filteredCocktails);
    });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    checkForDuplicatesAndDisplay(currentCocktails);
    loadingScreen.classList.add('hidden');
}

async function searchCocktailsByName(name) {
    loadingScreen.classList.remove('hidden');
    currentCocktails = [];

    if (!name) {
        showAlert("Bitte geben Sie einen Cocktailnamen ein.");
        loadingScreen.classList.add('hidden');
        return;
    }

    let cacheKey = `name:${standartizeCocktailName(name)}`;
    
    if (searchCache[cacheKey]) {
        displayCocktails(searchCache[cacheKey]);
        console.log("Cocktails aus dem Cache geholt:");
    } else {
        console.log("Cocktails nicht im Cache gefunden, Suche wird gestartet...");
        currentCocktails = allCocktailsCache.filter(cocktail => 
             cocktail.strDrink.toLowerCase().includes(standartizeCocktailName(name))
        );

        if (currentCocktails.length > 0) {
            searchCache[cacheKey] = currentCocktails;
            displayCocktails(currentCocktails);
        } else {
            displayNoCocktailsFound();
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    loadingScreen.classList.add('hidden');
}

// Funktion, die den Cocktailnamen standardisiert
// (z.B. Leerzeichen und Kommas entfernt, Kleinbuchstaben)
function standartizeCocktailName(name) {
    return name.trim().toLowerCase().replace(/,/g, ""); 
}

function checkForDuplicatesAndDisplay(allCocktails) {
    // Duplikate anhand der ID entfernen
    allCocktails = Array.from(new Set(allCocktails.map(a => a.idDrink)))
        .map(id => allCocktails.find(a => a.idDrink === id));

    // Cocktails anzeigen oder "Keine Cocktails gefunden"
    if (allCocktails.length > 0) {
        displayCocktails(allCocktails);
    } else {
        displayNoCocktailsFound();
    }
}

// Funktion, die die Cocktails auf der Webseite anzeigt
function displayCocktails(cocktails) {
    const cocktailList = document.getElementById("cocktailList");
    cocktailList.innerHTML = ""; // Liste leeren

    cocktails.forEach(cocktail => {
        // Neues Listenelement für jeden Cocktail erstellen
        const listItem = document.createElement("li");
        
        // Bild-Container erstellen
        const imgContainer = document.createElement("div");
        const cocktailImg = document.createElement("img");
        cocktailImg.className = "cocktail-image";
        cocktailImg.src = cocktail.strDrinkThumb || "placeholder-image.jpg"; // Fallback-Bild falls keins vorhanden
        cocktailImg.alt = cocktail.strDrink;
        imgContainer.appendChild(cocktailImg);
        
        // Info-Container erstellen
        const infoContainer = document.createElement("div");
        infoContainer.className = "cocktail-info";
        
        // Name
        const nameElement = document.createElement("div");
        nameElement.className = "cocktail-name";
        nameElement.textContent = cocktail.strDrink;
        
        // Kategorie
        const categoryElement = document.createElement("div");
        categoryElement.className = "cocktail-category";
        categoryElement.textContent = cocktail.strCategory || "No category";
        
        // Link zum Cocktail
        const cocktailLink = document.createElement("a");
        cocktailLink.href = `recipe.html?id=${cocktail.idDrink}`;
        cocktailLink.target = "_blank"; // Öffnen im neuen Tab
        
        // Elemente zusammenfügen
        infoContainer.appendChild(nameElement);
        infoContainer.appendChild(categoryElement);
        cocktailLink.appendChild(imgContainer);
        cocktailLink.appendChild(infoContainer);
        listItem.appendChild(cocktailLink);
        cocktailList.appendChild(listItem);
    });
}

function displayNoCocktailsFound() {
    const cocktailList = document.getElementById("cocktailList");
    cocktailList.innerHTML = "";
    showAlert("Keine Cocktails gefunden! Bitte versuchen Sie es mit anderen Suchkriterien.");
}


const searchInput = document.getElementById("input");
const searchType = document.getElementById("searchType");

// kombinierter Evenhandler für die Eingabe und den Typ der Suche
function handleSearchEvents(event){
    const searchTypeValue = searchType.value;

    // wenn der event vom Typ "change" ist, dann den Platzhalter ändern
    if(event.type === "change"){
        if (searchTypeValue === "ingredient") {
            searchInput.placeholder = "Search for ingredients...";
        } else if (searchTypeValue === "name") {
            searchInput.placeholder = "Search for cocktail names...";
        }
    }
    // wenn der Event vom Typ "keydown" ist und die Taste "Enter" gedrückt wurde, 
    // dann die Suche starten
    else if(event.type === "keydown" && event.key === "Enter"){
        if (searchTypeValue === "ingredient") {
            const ingredient = searchInput.value;
            searchCocktailsByIngredient(ingredient);
        } else if (searchTypeValue === "name") {
            const name = searchInput.value;
            searchCocktailsByName(name);
        }
    }	
}

// Event-Listener für die Eingabe und den Typ der Suche
searchInput.addEventListener("keydown", handleSearchEvents);
searchType.addEventListener("change", handleSearchEvents);


// Altersabfrage
document.addEventListener("DOMContentLoaded", function() {
    const ageCheck = document.getElementById("ageCheck");
    const yesButton = document.getElementById("yesButton");
    const noButton = document.getElementById("noButton");

    yesButton.addEventListener("click", function() {
        ageCheck.style.display = "none";
    });

    noButton.addEventListener("click", function() {
        document.body.innerHTML = "<h1 style='text-align:center; margin-top: 100px;'>🚫 Access denied!</h1>";
    });
});


const randomCocktailButton = document.getElementById("randomButton");

randomCocktailButton.addEventListener("click", async () => {
    loadingScreen.classList.remove('hidden');
    const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/random.php`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
            displayCocktails(data.drinks);
    } catch (error) {
        console.error('Error fetching random cocktail:', error);
        showAlert("Fehler beim Laden des zufälligen Cocktails.");
    } finally {
        await new Promise(resolve => setTimeout(resolve, 300));
        loadingScreen.classList.add('hidden');
    }
});

// Sidebar Toggle
document.addEventListener("DOMContentLoaded", function() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    if (sidebarToggle && sidebar) {  // Überprüfung ob Elemente existieren
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
});

// Beim Laden der Website aufrufen
document.addEventListener("DOMContentLoaded", function () {
    loadCocktailsByAlphabet();
});


const applyFilters = document.getElementById("applyFilters");

applyFilters.addEventListener("click", () => {
    const selectedAlcoholContent = document.getElementById("alcoholFilter").value;
    const selectedCategory = document.getElementById("categoryFilter").value;
    const selectedGlass = document.getElementById("glassFilter").value;

    let filteredCocktails = currentCocktails;

    if (selectedAlcoholContent && selectedAlcoholContent !== "All") {
        filteredCocktails = filteredCocktails.filter(
            cocktail => cocktail.strAlcoholic === selectedAlcoholContent
        );
    }
    if (selectedCategory && selectedCategory !== "All") {
        filteredCocktails = filteredCocktails.filter(
            cocktail => cocktail.strCategory === selectedCategory
        );
    }
    if (selectedGlass && selectedGlass !== "All") {
        filteredCocktails = filteredCocktails.filter(
            cocktail => cocktail.strGlass === selectedGlass
        );
    }

    if (filteredCocktails.length > 0) {
        checkForDuplicatesAndDisplay(filteredCocktails);
    } else {
        displayNoCocktailsFound();
    }
});