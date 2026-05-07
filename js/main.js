const navTriggerBtn = document.querySelector('#nav_trigger_btn');
const navMenu = document.querySelector('#nav_menu');

// Event listener for the nav trigger button
navTriggerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('nav-is-open');
});

// TheMealDB API Integration
const ingredientInput = document.getElementById('ingredient-input');
const searchBtn = document.getElementById('search-btn');
const mealsContainer = document.getElementById('meals-container');
const loadingIndicator = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreBtn = document.getElementById('load-more-btn');

// Store all meals and track how many are displayed
let allMeals = [];
let displayedCount = 0;
const MEALS_PER_PAGE = 6;

// Dialog elements
const dialog = document.getElementById('myDialog');
const closeBtn = document.querySelector('.close-btn');

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        dialog.close();
    });
}

// Function to show loading state
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    mealsContainer.innerHTML = '';
}

// Function to hide loading state
function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

// Function to show error message
function showError(message) {
    errorMessage.classList.remove('hidden');
    errorMessage.querySelector('p').textContent = message;
}

// Function to create a meal card
function createMealCard(meal) {
    const card = document.createElement('div');
    card.className = 'rounded overflow-hidden shadow-lg relative z-20 bg-white hover:shadow-xl transition-shadow duration-300';
    
    card.innerHTML = `
        <div class="relative">
            <img class="w-full h-48 object-cover" src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="absolute bottom-2 right-2 bg-accent text-white text-xs px-2 py-1 rounded-full">
                ${meal.strCategory || 'Recipe'}
            </div>
        </div>
        <div class="px-6 py-4">
            <div class="font-bold text-xl mb-2 text-primary line-clamp-1">${meal.strMeal}</div>
            <p class="text-gray-700 text-sm line-clamp-3">
                ${meal.strInstructions ? meal.strInstructions.substring(0, 100) + '...' : 'Delicious recipe waiting to be discovered!'}
            </p>
        </div>
        <div class="px-6 pt-2 pb-4">
            <div class="flex flex-wrap gap-1 mb-3">
                ${meal.strArea ? `<span class="text-xs bg-accent-secondary text-primary px-2 py-1 rounded-full">${meal.strArea}</span>` : ''}
                ${meal.strTags ? meal.strTags.split(',').slice(0, 2).map(tag => 
                    `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">${tag.trim()}</span>`
                ).join('') : ''}
            </div>
            <div class="flex justify-end">
                <button class="get-recipe-btn inline-block bg-accent hover:bg-accent-hover rounded-full px-6 py-2 text-sm font-semibold text-white transition-all duration-300" data-meal-id="${meal.idMeal}">
                    get recipe
                </button>
            </div>
        </div>
    `;
    
    // Add click event for the "get recipe" button
    const recipeBtn = card.querySelector('.get-recipe-btn');
    recipeBtn.addEventListener('click', () => {
        openRecipeModal(meal.idMeal);
    });
    
    return card;
}

// Function to display meals (used for initial load and load more)
function displayMeals(meals) {
    meals.forEach(meal => {
        const card = createMealCard(meal);
        mealsContainer.appendChild(card);
    });
}

// Function to show/hide load more button
function updateLoadMoreButton() {
    if (displayedCount < allMeals.length) {
        loadMoreContainer.classList.remove('hidden');
    } else {
        loadMoreContainer.classList.add('hidden');
    }
}

// Function to load more meals
function loadMoreMeals() {
    const nextMeals = allMeals.slice(displayedCount, displayedCount + MEALS_PER_PAGE);
    displayMeals(nextMeals);
    displayedCount += nextMeals.length;
    updateLoadMoreButton();
}

// Function to fetch meals by ingredient
async function searchMealsByIngredient(ingredient) {
    showLoading();
    loadMoreContainer.classList.add('hidden');
    
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
        const data = await response.json();
        
        hideLoading();
        
        if (!data.meals) {
            showError(`No meals found with "${ingredient}". Try another ingredient!`);
            return;
        }
        
        // Clear container and reset state
        mealsContainer.innerHTML = '';
        allMeals = [];
        displayedCount = 0;
        
        // Fetch full details for each meal to get instructions
        const mealPromises = data.meals.slice(0, 18).map(meal => 
            fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
                .then(res => res.json())
                .then(data => data.meals[0])
        );
        
        allMeals = await Promise.all(mealPromises);
        
        // Display first 6 meals
        const initialMeals = allMeals.slice(0, MEALS_PER_PAGE);
        displayMeals(initialMeals);
        displayedCount = initialMeals.length;
        
        // Show load more button if there are more meals
        updateLoadMoreButton();
        
    } catch (error) {
        hideLoading();
        showError('Something went wrong. Please try again later.');
        console.error('Error fetching meals:', error);
    }
}

// Function to open recipe modal with full details
async function openRecipeModal(mealId) {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        const data = await response.json();
        const meal = data.meals[0];
        
        // Get ingredients list
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure || ''} ${ingredient}`.trim());
            }
        }
        
        // Update dialog content
        const dialogContent = dialog.querySelector('.flex.flex-col');
        dialogContent.innerHTML = `
            <div class="max-w-2xl mx-auto rounded overflow-hidden shadow-lg bg-white w-full max-h-[80vh] overflow-y-auto">
                <img class="w-full h-64 object-cover" src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <div class="px-6 py-4">
                    <h3 class="font-bold text-2xl mb-2 text-primary">${meal.strMeal}</h3>
                    <div class="flex gap-2 mb-4">
                        <span class="text-xs bg-accent text-white px-3 py-1 rounded-full">${meal.strCategory}</span>
                        <span class="text-xs bg-primary text-white px-3 py-1 rounded-full">${meal.strArea}</span>
                    </div>
                    
                    <h4 class="font-bold text-lg mb-2 text-primary">Ingredients:</h4>
                    <ul class="list-disc list-inside mb-4 text-gray-700 text-sm grid grid-cols-2 gap-1">
                        ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                    
                    <h4 class="font-bold text-lg mb-2 text-primary">Instructions:</h4>
                    <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                        ${meal.strInstructions}
                    </p>
                    
                    ${meal.strYoutube ? `
                        <div class="mt-4">
                            <a href="${meal.strYoutube}" target="_blank" class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm transition-all duration-300">
                                <i class="ri-youtube-fill"></i> Watch Video
                            </a>
                        </div>
                    ` : ''}
                </div>
                <div class="px-6 pt-4 pb-6 flex justify-center">
                    <button class="close-btn inline-block bg-primary hover:bg-primary-hover rounded-full px-8 py-2 text-sm font-semibold text-white transition-all duration-300">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        // Re-attach close button event
        const newCloseBtn = dialogContent.querySelector('.close-btn');
        newCloseBtn.addEventListener('click', () => {
            dialog.close();
        });
        
        dialog.showModal();
        
    } catch (error) {
        console.error('Error fetching meal details:', error);
    }
}

// Event listeners for search
searchBtn.addEventListener('click', () => {
    const ingredient = ingredientInput.value.trim();
    if (ingredient) {
        searchMealsByIngredient(ingredient);
    }
});

ingredientInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const ingredient = ingredientInput.value.trim();
        if (ingredient) {
            searchMealsByIngredient(ingredient);
        }
    }
});

// Load more button event listener
loadMoreBtn.addEventListener('click', () => {
    loadMoreMeals();
});

// Initialize Suggestion Swiper Slider
const suggestionSwiper = new Swiper('.suggestionSwiper', {
    slidesPerView: 1,
    spaceBetween: 24,
    loop: true,
    autoplay: {
        delay: 4000,
        disableOnInteraction: false,
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    navigation: {
        nextEl: '.suggestion-next',
        prevEl: '.suggestion-prev',
    },
    breakpoints: {
        640: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        },
    },
});




