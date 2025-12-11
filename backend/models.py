# Waste categories for multi-class classification
WASTE_CATEGORIES = [
    {'id': 0, 'name': 'Plastic', 'type': 'Non-Biodegradable', 'color': '#e74c3c', 'icon': 'fas fa-wine-bottle'},
    {'id': 1, 'name': 'Glass', 'type': 'Non-Biodegradable', 'color': '#3498db', 'icon': 'fas fa-wine-glass'},
    {'id': 2, 'name': 'Metal', 'type': 'Non-Biodegradable', 'color': '#95a5a6', 'icon': 'fas fa-cog'},
    {'id': 3, 'name': 'Paper', 'type': 'Biodegradable', 'color': '#f1c40f', 'icon': 'fas fa-newspaper'},
    {'id': 4, 'name': 'Cardboard', 'type': 'Biodegradable', 'color': '#d35400', 'icon': 'fas fa-box'},
    {'id': 5, 'name': 'Organic/Food', 'type': 'Biodegradable', 'color': '#27ae60', 'icon': 'fas fa-apple-alt'},
    {'id': 6, 'name': 'Fruit/Veg', 'type': 'Biodegradable', 'color': '#2ecc71', 'icon': 'fas fa-leaf'},
    {'id': 7, 'name': 'Textile', 'type': 'Non-Biodegradable', 'color': '#9b59b6', 'icon': 'fas fa-tshirt'},
    {'id': 8, 'name': 'E-waste', 'type': 'Non-Biodegradable', 'color': '#34495e', 'icon': 'fas fa-laptop'},
    {'id': 9, 'name': 'Other', 'type': 'Unknown', 'color': '#7f8c8d', 'icon': 'fas fa-question'}
]

def get_disposal_info(waste_name, waste_type):
    """Get detailed disposal information for each waste type"""
    disposal_guides = {
        'Plastic': {
            'category': 'Recyclable Plastic',
            'instructions': [
                'Clean and rinse the plastic item',
                'Check recycling number on bottom (1-7)',
                'Place in blue recycling bin',
                'Remove caps and labels when possible'
            ],
            'tips': [
                'Avoid single-use plastics when possible',
                'Reuse plastic containers when safe',
                'Plastic bags should be recycled separately',
                'Flatten bottles to save space'
            ],
            'recycling_info': 'Most plastics are recyclable but check local guidelines',
            'decomposition': '450+ years to decompose',
            'examples': 'Water bottles, food containers, plastic bags, packaging'
        },
        'Glass': {
            'category': 'Recyclable Glass',
            'instructions': [
                'Rinse glass containers thoroughly',
                'Remove metal or plastic lids',
                'Place in glass recycling bin',
                'Do not mix with regular trash'
            ],
            'tips': [
                'Glass is 100% recyclable indefinitely',
                'Broken glass should be wrapped in paper',
                'Different colored glass may be separated',
                'Consider reusing glass jars'
            ],
            'recycling_info': 'Glass can be recycled endlessly without quality loss',
            'decomposition': '1 million years to decompose',
            'examples': 'Wine bottles, jars, glass containers, broken glass'
        },
        'Metal': {
            'category': 'Recyclable Metal',
            'instructions': [
                'Clean metal cans and containers',
                'Remove any food residue',
                'Place in metal recycling bin',
                'Separate aluminum and steel if required'
            ],
            'tips': [
                'Aluminum cans are highly valuable to recycle',
                'Scrap metal can often be sold',
                'Flatten cans to save space',
                'Check for local metal recycling centers'
            ],
            'recycling_info': 'Metals are highly recyclable and energy-efficient',
            'decomposition': '50-500 years to decompose',
            'examples': 'Aluminum cans, steel cans, foil, metal containers'
        },
        'Paper': {
            'category': 'Recyclable Paper',
            'instructions': [
                'Keep paper dry and clean',
                'Remove any plastic windows',
                'Flatten cardboard boxes',
                'Place in paper recycling bin'
            ],
            'tips': [
                'Shredded paper may have special handling',
                'Greasy pizza boxes may not be recyclable',
                'Reuse paper before recycling',
                'Use both sides when printing'
            ],
            'recycling_info': 'Paper can typically be recycled 5-7 times',
            'decomposition': '2-6 weeks to decompose',
            'examples': 'Newspaper, office paper, magazines, cardboard'
        },
        'Cardboard': {
            'category': 'Recyclable Cardboard',
            'instructions': [
                'Flatten all cardboard boxes',
                'Remove tape and labels',
                'Keep dry and clean',
                'Place in cardboard recycling'
            ],
            'tips': [
                'Corrugated cardboard is highly recyclable',
                'Wet cardboard should be thrown away',
                'Reuse boxes for storage or shipping',
                'Break down large boxes'
            ],
            'recycling_info': 'Cardboard fibers can be recycled multiple times',
            'decomposition': '2 months to decompose',
            'examples': 'Shipping boxes, cereal boxes, packaging cardboard'
        },
        'Organic/Food': {
            'category': 'Compostable Organic',
            'instructions': [
                'Place in green compost bin',
                'Use for home composting',
                'Can be buried in garden',
                'Avoid meat and dairy in home compost'
            ],
            'tips': [
                'Chop into smaller pieces for faster decomposition',
                'Mix with dry leaves or paper',
                'Turn compost regularly',
                'Keep compost moist but not wet'
            ],
            'recycling_info': 'Excellent for creating nutrient-rich soil',
            'decomposition': '2-8 weeks to decompose',
            'examples': 'Fruit peels, vegetable scraps, coffee grounds, eggshells'
        },
        'Fruit/Veg': {
            'category': 'Compostable Food Scraps',
            'instructions': [
                'Ideal for composting',
                'Place in food waste bin',
                'Can be used as fertilizer',
                'Great for worm farms'
            ],
            'tips': [
                'Citrus peels decompose slower',
                'Avoid composting diseased plants',
                'Balance with brown materials',
                'Freeze scraps if composting later'
            ],
            'recycling_info': 'Creates excellent natural fertilizer',
            'decomposition': '1-4 weeks to decompose',
            'examples': 'Banana peels, apple cores, carrot tops, lettuce leaves'
        },
        'Textile': {
            'category': 'Textile Waste',
            'instructions': [
                'Donate if in good condition',
                'Check for textile recycling bins',
                'Repurpose as cleaning rags',
                'Dispose in general waste if damaged'
            ],
            'tips': [
                'Many charities accept clothing donations',
                'Some retailers offer recycling programs',
                'Consider upcycling projects',
                'Separate natural and synthetic fibers'
            ],
            'recycling_info': 'Only 15% of textiles are currently recycled',
            'decomposition': '40-200 years to decompose',
            'examples': 'Clothing, towels, bedsheets, fabrics'
        },
        'E-waste': {
            'category': 'Electronic Waste',
            'instructions': [
                'Do NOT throw in regular trash',
                'Find e-waste recycling center',
                'Remove batteries if possible',
                'Check for manufacturer take-back'
            ],
            'tips': [
                'Many electronics contain valuable metals',
                'Some stores accept old electronics',
                'Wipe data from devices before recycling',
                'Consider repair before replacement'
            ],
            'recycling_info': 'E-waste contains toxic materials and valuable resources',
            'decomposition': 'Thousands of years for some components',
            'examples': 'Phones, laptops, batteries, cables, chargers'
        },
        'Other': {
            'category': 'General Waste',
            'instructions': [
                'Check local waste disposal guidelines',
                'When in doubt, contact local authorities',
                'Dispose in appropriate waste bin',
                'Follow community recycling rules'
            ],
            'tips': [
                'Reduce consumption when possible',
                'Reuse items before disposal',
                'Recycle whenever feasible',
                'Stay informed about waste management'
            ],
            'recycling_info': 'Check specific guidelines for this material',
            'decomposition': 'Varies by material',
            'examples': 'Mixed materials, unknown items, composite waste'
        }
    }

    # Default for unknown categories
    default_info = {
        'category': 'General Waste',
        'instructions': ['Check local waste disposal guidelines', 'When in doubt, contact local authorities'],
        'tips': ['Reduce consumption when possible', 'Reuse items before disposal', 'Recycle whenever feasible'],
        'recycling_info': 'Check specific guidelines for this material',
        'decomposition': 'Varies by material',
        'examples': 'Various waste materials'
    }

    return disposal_guides.get(waste_name, default_info)
