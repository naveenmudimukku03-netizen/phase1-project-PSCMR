// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const sampleBtn = document.getElementById('sampleBtn');
const fileInfo = document.getElementById('fileInfo');
const loadingModal = document.getElementById('loadingModal');
const sampleModal = document.getElementById('sampleModal');
const closeModalBtn = document.querySelector('.close-modal');

// Results Elements
const topPredictionCard = document.getElementById('topPredictionCard');
const topCategoryName = document.getElementById('topCategoryName');
const topCategoryType = document.getElementById('topCategoryType');
const topConfidence = document.getElementById('topConfidence');
const categoriesContainer = document.getElementById('categoriesContainer');

const predictionIcon = document.getElementById('predictionIcon');
const predictionText = document.getElementById('predictionText');
const confidenceText = document.getElementById('confidenceText');
const nonBioBar = document.getElementById('nonBioBar');
const bioBar = document.getElementById('bioBar');
const nonBioPercent = document.getElementById('nonBioPercent');
const bioPercent = document.getElementById('bioPercent');
const disposalContent = document.getElementById('disposalContent');
const disposalCard = document.getElementById('disposalCard');

// Chart
let probabilityChart = null;

// Backend URL (Update this to your backend URL)
const BACKEND_URL = 'http://localhost:5000';

// Current image file
let currentImageFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initChart();
    smoothScroll();
    initMobileMenu();
});

// Event Listeners
function initEventListeners() {
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input change
    imageInput.addEventListener('change', handleFileSelect);
    
    // Button clicks
    analyzeBtn.addEventListener('click', analyzeImage);
    resetBtn.addEventListener('click', resetAll);
    sampleBtn.addEventListener('click', showSampleModal);
    
    // Close modal
    closeModalBtn.addEventListener('click', () => {
        sampleModal.classList.remove('active');
    });
    
    // Sample images click
    document.querySelectorAll('.sample-item').forEach(item => {
        item.addEventListener('click', () => {
            const imageType = item.dataset.image;
            loadSampleImage(imageType);
            sampleModal.classList.remove('active');
        });
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === sampleModal) {
            sampleModal.classList.remove('active');
        }
        if (e.target === loadingModal) {
            loadingModal.classList.remove('active');
        }
    });
}

// Chart initialization
function initChart() {
    const ctx = document.getElementById('probabilityChart').getContext('2d');
    probabilityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Non-Biodegradable', 'Biodegradable'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#e74c3c', '#2ecc71'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// Mobile menu initialization
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close mobile menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageFile(files[0]);
    }
}

// File selection handler
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

// Image file handler
function handleImageFile(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
    }
    
    currentImageFile = file;
    
    // Update file info
    fileInfo.innerHTML = `
        <div class="file-details">
            <strong>File:</strong> ${file.name}<br>
            <strong>Size:</strong> ${formatFileSize(file.size)}<br>
            <strong>Type:</strong> ${file.type.split('/')[1].toUpperCase()}
        </div>
    `;
    
    // Display preview
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.innerHTML = `
            <img src="${e.target.result}" alt="Uploaded Image">
        `;
    };
    reader.readAsDataURL(file);
    
    // Enable analyze button
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> Identify Waste';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Analyze image
async function analyzeImage() {
    if (!currentImageFile) return;
    
    showLoading(true);
    
    const formData = new FormData();
    formData.append('file', currentImageFile);
    
    try {
        const response = await fetch(`${BACKEND_URL}/predict`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayMultiClassResults(data);
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        // Fallback to demo data if backend fails
        displayDemoResults();
    } finally {
        showLoading(false);
    }
}

// Display multi-class results
function displayMultiClassResults(data) {
    console.log("Received data:", data);
    
    const predictions = data.predictions || [];
    const topPrediction = data.top_prediction || {};
    const disposalInfo = data.disposal || {};
    
    if (predictions.length === 0) {
        showError('No predictions received from server');
        return;
    }
    
    // Update top prediction card
    updateTopPrediction(topPrediction);
    
    // Update waste categories display
    updateCategoriesDisplay(predictions);
    
    // Calculate biodegradable vs non-biodegradable percentages
    let bioTotal = 0;
    let nonBioTotal = 0;
    
    predictions.forEach(pred => {
        if (pred.type === 'Biodegradable') {
            bioTotal += pred.probability;
        } else if (pred.type === 'Non-Biodegradable') {
            nonBioTotal += pred.probability;
        }
    });
    
    // Update binary chart
    updateBinaryChart(bioTotal, nonBioTotal);
    
    // Update prediction summary
    updatePredictionSummary(topPrediction);
    
    // Update disposal instructions
    updateDisposalInfo(disposalInfo, topPrediction);
    
    // Scroll to results
    document.querySelector('.results-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Update top prediction display
function updateTopPrediction(topPrediction) {
    if (topPrediction.name) {
        topPredictionCard.style.display = 'block';
        
        topCategoryName.textContent = topPrediction.name;
        topCategoryType.textContent = topPrediction.type;
        topConfidence.textContent = `${topPrediction.probability}% confidence`;
        
        // Update icon
        const iconElement = document.querySelector('.category-icon-large i');
        if (iconElement) {
            iconElement.className = topPrediction.icon || 'fas fa-question';
            document.querySelector('.category-icon-large').style.background = topPrediction.color || '#7f8c8d';
        }
        
        topConfidence.style.background = topPrediction.color || '#7f8c8d';
        topCategoryType.style.border = `2px solid ${topPrediction.color || '#7f8c8d'}`;
    }
}

// Update categories display
function updateCategoriesDisplay(predictions) {
    categoriesContainer.innerHTML = '';
    
    predictions.forEach((pred, index) => {
        const card = createCategoryCard(pred, index === 0);
        categoriesContainer.appendChild(card);
        
        // Animate probability bar
        setTimeout(() => {
            const probBar = card.querySelector('.prob-fill');
            if (probBar) {
                probBar.style.width = `${pred.probability}%`;
            }
        }, 100 * index);
    });
}

// Create category card
function createCategoryCard(prediction, isTop = false) {
    const card = document.createElement('div');
    card.className = `category-card ${isTop ? 'top-prediction' : ''}`;
    card.style.borderLeftColor = prediction.color;
    
    card.innerHTML = `
        <div class="category-icon" style="background: ${prediction.color}">
            <i class="${prediction.icon}"></i>
        </div>
        <div class="category-content">
            <div class="category-name">${prediction.name}</div>
            <div class="category-type">
                ${prediction.type} 
                ${isTop ? '<span class="top-badge">TOP</span>' : ''}
            </div>
            <div class="category-probability">
                <div class="prob-bar">
                    <div class="prob-fill" style="width: 0%; background: ${prediction.color}"></div>
                </div>
                <div class="prob-percent">${prediction.probability}%</div>
            </div>
        </div>
    `;
    
    return card;
}

// Update binary chart
function updateBinaryChart(bioProb, nonBioProb) {
    // Update bars
    bioBar.style.width = `${bioProb}%`;
    nonBioBar.style.width = `${nonBioProb}%`;
    
    bioPercent.textContent = `${bioProb.toFixed(1)}%`;
    nonBioPercent.textContent = `${nonBioProb.toFixed(1)}%`;
    
    // Update chart
    if (probabilityChart) {
        probabilityChart.data.datasets[0].data = [nonBioProb, bioProb];
        probabilityChart.update();
    }
}

// Update prediction summary
function updatePredictionSummary(topPrediction) {
    if (topPrediction.name) {
        predictionText.textContent = topPrediction.name;
        predictionText.style.color = topPrediction.color || '#2c3e50';
        
        predictionIcon.innerHTML = `<i class="${topPrediction.icon || 'fas fa-question'}"></i>`;
        predictionIcon.className = `prediction-icon ${topPrediction.type === 'Biodegradable' ? 'bio' : 'non-bio'}`;
        predictionIcon.style.color = topPrediction.color || '#7f8c8d';
        
        confidenceText.textContent = `${topPrediction.probability}% confidence`;
    }
}

// Update disposal info
function updateDisposalInfo(disposalData, topPrediction) {
    if (!disposalData || Object.keys(disposalData).length === 0) {
        disposalContent.innerHTML = `
            <div class="disposal-placeholder">
                <i class="fas fa-info-circle"></i>
                <p>No disposal information available for ${topPrediction.name || 'this item'}</p>
            </div>
        `;
        return;
    }
    
    disposalContent.innerHTML = `
        <div class="disposal-header">
            <h4 style="color: ${topPrediction.color || '#2c3e50'}">
                <i class="${topPrediction.icon || 'fas fa-trash-alt'}"></i> ${disposalData.category || 'Waste Disposal Guide'}
            </h4>
            ${disposalData.recycling_info ? `
                <p class="recycling-info">${disposalData.recycling_info}</p>
            ` : ''}
            ${disposalData.decomposition ? `
                <p class="decomposition-info">
                    <i class="fas fa-clock"></i> Decomposition time: ${disposalData.decomposition}
                </p>
            ` : ''}
        </div>
        
        <div class="disposal-details">
            <div class="disposal-section">
                <h4><i class="fas fa-list-check"></i> How to Dispose:</h4>
                <ul class="instructions-list">
                    ${(disposalData.instructions || []).map(inst => `
                        <li><i class="fas fa-check"></i> ${inst}</li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="disposal-section">
                <h4><i class="fas fa-lightbulb"></i> Pro Tips:</h4>
                <ul class="tips-list">
                    ${(disposalData.tips || []).map(tip => `
                        <li><i class="fas fa-star"></i> ${tip}</li>
                    `).join('')}
                </ul>
            </div>
            
            ${disposalData.examples ? `
            <div class="disposal-section">
                <h4><i class="fas fa-box"></i> Common Examples:</h4>
                <p>${disposalData.examples}</p>
            </div>
            ` : ''}
        </div>
    `;
    
    disposalCard.style.display = 'block';
}

// Show loading modal
function showLoading(show) {
    if (show) {
        loadingModal.classList.add('active');
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    } else {
        loadingModal.classList.remove('active');
        if (currentImageFile) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> Identify Waste';
        }
    }
}

// Show error
function showError(message) {
    alert(`Error: ${message}`);
}

// Show sample modal
function showSampleModal() {
    sampleModal.classList.add('active');
}

// Load sample image
function loadSampleImage(imageType) {
    const samplePredictions = {
        'plastic': {
            predictions: [
                {id: 0, name: 'Plastic', type: 'Non-Biodegradable', probability: 85.5, color: '#e74c3c', icon: 'fas fa-wine-bottle'},
                {id: 1, name: 'Glass', type: 'Non-Biodegradable', probability: 8.2, color: '#3498db', icon: 'fas fa-wine-glass'},
                {id: 2, name: 'Metal', type: 'Non-Biodegradable', probability: 4.3, color: '#95a5a6', icon: 'fas fa-cog'},
                {id: 3, name: 'Paper', type: 'Biodegradable', probability: 2.0, color: '#f1c40f', icon: 'fas fa-newspaper'}
            ],
            top_prediction: {name: 'Plastic', probability: 85.5, type: 'Non-Biodegradable', color: '#e74c3c', icon: 'fas fa-wine-bottle'},
            disposal: {
                category: 'Recyclable Plastic',
                instructions: [
                    'Clean and rinse the plastic item',
                    'Check recycling number on bottom (1-7)',
                    'Place in blue recycling bin',
                    'Remove caps and labels when possible'
                ],
                tips: [
                    'Avoid single-use plastics when possible',
                    'Reuse plastic containers when safe',
                    'Plastic bags should be recycled separately',
                    'Flatten bottles to save space'
                ],
                recycling_info: 'Most plastics are recyclable but check local guidelines',
                decomposition: '450+ years to decompose',
                examples: 'Water bottles, food containers, plastic bags, packaging'
            }
        },
        'glass': {
            predictions: [
                {id: 1, name: 'Glass', type: 'Non-Biodegradable', probability: 92.5, color: '#3498db', icon: 'fas fa-wine-glass'},
                {id: 0, name: 'Plastic', type: 'Non-Biodegradable', probability: 5.2, color: '#e74c3c', icon: 'fas fa-wine-bottle'},
                {id: 2, name: 'Metal', type: 'Non-Biodegradable', probability: 1.8, color: '#95a5a6', icon: 'fas fa-cog'},
                {id: 3, name: 'Paper', type: 'Biodegradable', probability: 0.5, color: '#f1c40f', icon: 'fas fa-newspaper'}
            ],
            top_prediction: {name: 'Glass', probability: 92.5, type: 'Non-Biodegradable', color: '#3498db', icon: 'fas fa-wine-glass'},
            disposal: {
                category: 'Recyclable Glass',
                instructions: [
                    'Rinse glass containers thoroughly',
                    'Remove metal or plastic lids',
                    'Place in glass recycling bin',
                    'Do not mix with regular trash'
                ],
                tips: [
                    'Glass is 100% recyclable indefinitely',
                    'Broken glass should be wrapped in paper',
                    'Different colored glass may be separated',
                    'Consider reusing glass jars'
                ],
                recycling_info: 'Glass can be recycled endlessly without quality loss',
                decomposition: '1 million years to decompose',
                examples: 'Wine bottles, jars, glass containers, broken glass'
            }
        },
        'paper': {
            predictions: [
                {id: 3, name: 'Paper', type: 'Biodegradable', probability: 78.5, color: '#f1c40f', icon: 'fas fa-newspaper'},
                {id: 4, name: 'Cardboard', type: 'Biodegradable', probability: 15.2, color: '#d35400', icon: 'fas fa-box'},
                {id: 0, name: 'Plastic', type: 'Non-Biodegradable', probability: 4.3, color: '#e74c3c', icon: 'fas fa-wine-bottle'},
                {id: 1, name: 'Glass', type: 'Non-Biodegradable', probability: 2.0, color: '#3498db', icon: 'fas fa-wine-glass'}
            ],
            top_prediction: {name: 'Paper', probability: 78.5, type: 'Biodegradable', color: '#f1c40f', icon: 'fas fa-newspaper'},
            disposal: {
                category: 'Recyclable Paper',
                instructions: [
                    'Keep paper dry and clean',
                    'Remove any plastic windows',
                    'Flatten cardboard boxes',
                    'Place in paper recycling bin'
                ],
                tips: [
                    'Shredded paper may have special handling',
                    'Greasy pizza boxes may not be recyclable',
                    'Reuse paper before recycling',
                    'Use both sides when printing'
                ],
                recycling_info: 'Paper can typically be recycled 5-7 times',
                decomposition: '2-6 weeks to decompose',
                examples: 'Newspaper, office paper, magazines, cardboard'
            }
        },
        'organic': {
            predictions: [
                {id: 5, name: 'Organic/Food', type: 'Biodegradable', probability: 88.5, color: '#27ae60', icon: 'fas fa-apple-alt'},
                {id: 6, name: 'Fruit/Veg', type: 'Biodegradable', probability: 9.2, color: '#2ecc71', icon: 'fas fa-leaf'},
                {id: 3, name: 'Paper', type: 'Biodegradable', probability: 1.8, color: '#f1c40f', icon: 'fas fa-newspaper'},
                {id: 0, name: 'Plastic', type: 'Non-Biodegradable', probability: 0.5, color: '#e74c3c', icon: 'fas fa-wine-bottle'}
            ],
            top_prediction: {name: 'Organic/Food', probability: 88.5, type: 'Biodegradable', color: '#27ae60', icon: 'fas fa-apple-alt'},
            disposal: {
                category: 'Compostable Organic',
                instructions: [
                    'Place in green compost bin',
                    'Use for home composting',
                    'Can be buried in garden',
                    'Avoid meat and dairy in home compost'
                ],
                tips: [
                    'Chop into smaller pieces for faster decomposition',
                    'Mix with dry leaves or paper',
                    'Turn compost regularly',
                    'Keep compost moist but not wet'
                ],
                recycling_info: 'Excellent for creating nutrient-rich soil',
                decomposition: '2-8 weeks to decompose',
                examples: 'Fruit peels, vegetable scraps, coffee grounds, eggshells'
            }
        },
        'metal': {
            predictions: [
                {id: 2, name: 'Metal', type: 'Non-Biodegradable', probability: 91.5, color: '#95a5a6', icon: 'fas fa-cog'},
                {id: 0, name: 'Plastic', type: 'Non-Biodegradable', probability: 5.2, color: '#e74c3c', icon: 'fas fa-wine-bottle'},
                {id: 1, name: 'Glass', type: 'Non-Biodegradable', probability: 2.8, color: '#3498db', icon: 'fas fa-wine-glass'},
                {id: 3, name: 'Paper', type: 'Biodegradable', probability: 0.5, color: '#f1c40f', icon: 'fas fa-newspaper'}
            ],
            top_prediction: {name: 'Metal', probability: 91.5, type: 'Non-Biodegradable', color: '#95a5a6', icon: 'fas fa-cog'},
            disposal: {
                category: 'Recyclable Metal',
                instructions: [
                    'Clean metal cans and containers',
                    'Remove any food residue',
                    'Place in metal recycling bin',
                    'Separate aluminum and steel if required'
                ],
                tips: [
                    'Aluminum cans are highly valuable to recycle',
                    'Scrap metal can often be sold',
                    'Flatten cans to save space',
                    'Check for local metal recycling centers'
                ],
                recycling_info: 'Metals are highly recyclable and energy-efficient',
                decomposition: '50-500 years to decompose',
                examples: 'Aluminum cans, steel cans, foil, metal containers'
            }
        },
        'cardboard': {
            predictions: [
                {id: 4, name: 'Cardboard', type: 'Biodegradable', probability: 82.5, color: '#d35400', icon: 'fas fa-box'},
                {id: 3, name: 'Paper', type: 'Biodegradable', probability: 12.2, color: '#f1c40f', icon: 'fas fa-newspaper'},
                {id: 0, name: 'Plastic', type: 'Non-Biodegradable', probability: 3.8, color: '#e74c3c', icon: 'fas fa-wine-bottle'},
                {id: 1, name: 'Glass', type: 'Non-Biodegradable', probability: 1.5, color: '#3498db', icon: 'fas fa-wine-glass'}
            ],
            top_prediction: {name: 'Cardboard', probability: 82.5, type: 'Biodegradable', color: '#d35400', icon: 'fas fa-box'},
            disposal: {
                category: 'Recyclable Cardboard',
                instructions: [
                    'Flatten all cardboard boxes',
                    'Remove tape and labels',
                    'Keep dry and clean',
                    'Place in cardboard recycling'
                ],
                tips: [
                    'Corrugated cardboard is highly recyclable',
                    'Wet cardboard should be thrown away',
                    'Reuse boxes for storage or shipping',
                    'Break down large boxes'
                ],
                recycling_info: 'Cardboard fibers can be recycled multiple times',
                decomposition: '2 months to decompose',
                examples: 'Shipping boxes, cereal boxes, packaging cardboard'
            }
        }
    };
    
    const sampleData = samplePredictions[imageType];
    if (sampleData) {
        displayMultiClassResults(sampleData);
        alert(`Sample analysis complete! Showing results for ${sampleData.top_prediction.name}.`);
    }
}

// Display demo results (fallback)
function displayDemoResults() {
    const demoData = {
        predictions: [
            {id: 0, name: 'Plastic', type: 'Non-Biodegradable', probability: 65.5, color: '#e74c3c', icon: 'fas fa-wine-bottle'},
            {id: 1, name: 'Glass', type: 'Non-Biodegradable', probability: 20.2, color: '#3498db', icon: 'fas fa-wine-glass'},
            {id: 2, name: 'Metal', type: 'Non-Biodegradable', probability: 8.3, color: '#95a5a6', icon: 'fas fa-cog'},
            {id: 3, name: 'Paper', type: 'Biodegradable', probability: 6.0, color: '#f1c40f', icon: 'fas fa-newspaper'}
        ],
        top_prediction: {name: 'Plastic', probability: 65.5, type: 'Non-Biodegradable', color: '#e74c3c', icon: 'fas fa-wine-bottle'},
        disposal: {
            category: 'Recyclable Waste',
            instructions: [
                'Check local recycling guidelines',
                'Clean item before disposal',
                'Separate different materials',
                'Use appropriate recycling bins'
            ],
            tips: [
                'When in doubt, check with local authorities',
                'Reduce consumption when possible',
                'Reuse items before recycling',
                'Stay informed about recycling changes'
            ],
            recycling_info: 'Demo mode - connect to backend for accurate classification',
            decomposition: 'Varies by material',
            examples: 'Various waste materials'
        }
    };
    
    displayMultiClassResults(demoData);
}

// Reset everything
function resetAll() {
    currentImageFile = null;
    imageInput.value = '';
    fileInfo.innerHTML = '';
    imagePreview.innerHTML = `
        <div class="preview-placeholder">
            <i class="fas fa-image"></i>
            <p>Your image will appear here</p>
        </div>
    `;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-brain"></i> Identify Waste';
    
    // Reset top prediction
    topPredictionCard.style.display = 'none';
    topCategoryName.textContent = '-';
    topCategoryType.textContent = '-';
    topConfidence.textContent = '-';
    
    // Reset categories
    categoriesContainer.innerHTML = `
        <div class="category-placeholder">
            <i class="fas fa-search"></i>
            <p>Upload an image to see detailed waste classification</p>
        </div>
    `;
    
    // Reset prediction summary
    predictionIcon.innerHTML = '<i class="fas fa-question"></i>';
    predictionIcon.className = 'prediction-icon';
    predictionIcon.style.color = '';
    predictionText.textContent = 'Upload an image to analyze';
    predictionText.style.color = '';
    confidenceText.textContent = '-';
    
    // Reset binary chart
    bioBar.style.width = '0%';
    nonBioBar.style.width = '0%';
    bioPercent.textContent = '0%';
    nonBioPercent.textContent = '0%';
    
    if (probabilityChart) {
        probabilityChart.data.datasets[0].data = [0, 0];
        probabilityChart.update();
    }
    
    // Reset disposal info
    disposalContent.innerHTML = `
        <div class="disposal-placeholder">
            <i class="fas fa-recycle"></i>
            <p>Analysis results will show proper disposal instructions here</p>
        </div>
    `;
    disposalCard.style.display = 'block';
}

// Smooth scroll for navigation
function smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Add CSS for top badge dynamically
const style = document.createElement('style');
style.textContent = `
    .top-badge {
        background: var(--primary);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.7rem;
        margin-left: 8px;
        vertical-align: middle;
        display: inline-block;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .category-card {
        animation: fadeIn 0.3s ease forwards;
        opacity: 0;
    }
`;
document.head.appendChild(style);