// מחשבון גנט - עם תרשימים ויצוא PDF

// משתנים לניהול תוכניות גנט - משתמשים במשתנים הגלובליים הקיימים
var savedGanttPlans = []; 
var currentGanttData = null; 

// פונקציה לוידוא שהמשתנים הגלובליים קיימים
function ensureGlobalVariables() {
    if (typeof window !== 'undefined') {
        if (!window.selectedMalls) {
            window.selectedMalls = new Set();
        }
        if (!window.allMalls) {
            window.allMalls = [];
        }
    }
}

// פונקציה לעדכון רשימת המתחמים
function updateGanttMallOptions() {
    console.log('מעדכן רשימת מתחמים לגנט...');
    
    ensureGlobalVariables(); // וידוא שהמשתנים קיימים
    
    if (!productsData || !Array.isArray(productsData) || productsData.length === 0) {
        console.log('אין נתוני מוצרים');
        return;
    }
    
    const allMallsSet = new Set();
    productsData.forEach(p => {
        const mall = p['מתחם'];
        if (mall && mall.trim()) {
            allMallsSet.add(mall.trim());
        }
    });
    
    // השתמש במשתנה הגלובלי
    const globalAllMalls = typeof window !== 'undefined' && window.allMalls ? window.allMalls : allMalls;
    globalAllMalls.length = 0;
    Array.from(allMallsSet).sort().forEach(mall => globalAllMalls.push(mall));
    
    console.log('מתחמים שנמצאו:', globalAllMalls);
    updateMallsDropdown();
}

// פונקציה לעדכון הרשימה הנפתחת
function updateMallsDropdown() {
    const dropdown = document.getElementById('mallsDropdown');
    if (!dropdown) {
        console.log('לא נמצא אלמנט mallsDropdown');
        return;
    }
    
    dropdown.innerHTML = '';
    
    // השתמש במשתנים הגלובליים
    const mallsToUse = (typeof window !== 'undefined' && window.allMalls) ? window.allMalls : (typeof allMalls !== 'undefined' ? allMalls : []);
    const selectedMallsToUse = (typeof window !== 'undefined' && window.selectedMalls) ? window.selectedMalls : (typeof selectedMalls !== 'undefined' ? selectedMalls : new Set());
    
    if (mallsToUse.length === 0) {
        dropdown.innerHTML = '<div class="multi-select-option">אין מתחמים זמינים</div>';
        return;
    }
    
    // אפשרות "בחר הכל"
    const selectAllOption = document.createElement('div');
    selectAllOption.className = 'multi-select-option';
    selectAllOption.innerHTML = `
        <input type="checkbox" id="selectAll" ${selectedMalls.size === allMalls.length ? 'checked' : ''}>
        <label for="selectAll"><strong>בחר הכל</strong></label>
    `;
    selectAllOption.addEventListener('click', function(e) {
        e.stopPropagation();
        const checkbox = this.querySelector('input');
        
        if (checkbox.checked) {
            selectedMalls.clear();
        } else {
            selectedMalls.clear();
            allMalls.forEach(mall => selectedMalls.add(mall));
        }
        updateMallsDisplay();
        updateMallsDropdown();
    });
    dropdown.appendChild(selectAllOption);
    
    // הוספת קו מפריד
    const separator = document.createElement('div');
    separator.style.borderTop = '1px solid #e9ecef';
    separator.style.margin = '5px 0';
    dropdown.appendChild(separator);
    
    // אפשרויות המתחמים
    allMalls.forEach(mall => {
        const option = document.createElement('div');
        option.className = 'multi-select-option';
        option.innerHTML = `
            <input type="checkbox" id="mall-${mall}" ${ganttSelectedMalls.has(mall) ? 'checked' : ''}>
            <label for="mall-${mall}">${mall}</label>
        `;
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const checkbox = this.querySelector('input');
            
            if (checkbox.checked) {
                selectedMalls.delete(mall);
            } else {
                selectedMalls.add(mall);
            }
            updateMallsDisplay();
            updateMallsDropdown();
        });
        dropdown.appendChild(option);
    });
}

// פונקציה לעדכון תצוגת המתחמים הנבחרים
function updateMallsDisplay() {
    const selectedMallsDiv = document.getElementById('selectedMalls');
    if (!selectedMallsDiv) {
        console.log('לא נמצא אלמנט selectedMalls');
        return;
    }
    
    if (selectedMalls.size === 0) {
        selectedMallsDiv.innerHTML = '<span style="color:#999;">בחר מתחמים...</span>';
    } else {
        selectedMallsDiv.innerHTML = '';
        Array.from(selectedMalls).forEach(mall => {
            const item = document.createElement('div');
            item.className = 'selected-item';
            item.innerHTML = `
                ${mall}
                <span class="remove" onclick="removeMall('${mall}')">×</span>
            `;
            selectedMallsDiv.appendChild(item);
        });
    }
}

// פונקציה להסרת מתחם
function removeMall(mall) {
    selectedMalls.delete(mall);
    updateMallsDisplay();
    updateMallsDropdown();
}

// פונקציה לחישוב תקציב גנט
function calculateGanttBudget() {
    console.log('מתחיל חישוב גנט...');
    console.log('מתחמים נבחרים:', Array.from(selectedMalls));
    console.log('נתוני מוצרים:', productsData ? productsData.length : 'לא זמינים');
    
    const type = document.getElementById('ganttType').value;
    const budget = Number(document.getElementById('ganttBudget').value);
    
    if (selectedMalls.size === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">אנא בחר לפחות מתחם אחד</div>';
        return;
    }
    
    if (!productsData || productsData.length === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">אין נתוני מוצרים זמינים</div>';
        return;
    }
    
    let mallSums = {};
    let mallCounts = {};
    
    // חישוב סכומים לכל מתחם נבחר
    productsData.forEach((p, index) => {
        const mall = p['מתחם'];
        if (!mall) return;
        
        const mallTrimmed = mall.trim();
        if (!ganttSelectedMalls.has(mallTrimmed)) return;
        
        // סינון לפי סוג קמפיין - בדיקה מדויקת
        const campaignStr = String(p['קמפיין'] || '').trim();
        
        console.log(`מוצר ${mall}: קמפיין="${campaignStr}", בודק סוג="${type}"`);
        
        if (type === 'פרינט') {
            // כלול רק אם הערך הוא בדיוק "פרינט"
            if (campaignStr !== 'פרינט') {
                console.log('מדלג - לא פרינט מדויק');
                return;
            }
        } else if (type === 'דיגיטלי') {
            // כלול רק אם הערך הוא בדיוק "דיגטלי"
            if (campaignStr !== 'דיגטלי') {
                console.log('מדלג - לא דיגטלי מדויק');
                return;
            }
        }
        
        // חילוץ מחיר
        let priceStr = String(p['מחיר מכירה'] || '0');
        let price = Number(priceStr.replace(/[^0-9.]/g, ''));
        if (isNaN(price)) price = 0;
        
        if (!mallSums[mallTrimmed]) {
            mallSums[mallTrimmed] = 0;
            mallCounts[mallTrimmed] = 0;
        }
        mallSums[mallTrimmed] += price;
        mallCounts[mallTrimmed]++;
    });
    
    const selectedMallsList = Array.from(ganttSelectedMalls);
    
    // בדיקה שיש נתונים
    const totalSum = Object.values(mallSums).reduce((a, b) => a + b, 0);
    if (totalSum === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">לא נמצאו מוצרים עם מחירים תקפים למתחמים הנבחרים</div>';
        return;
    }
    
    // סינון לפי תקציב אם הוגדר - רק מהמתחמים שיש להם נתונים
    const mallsWithData = Object.keys(mallSums).filter(mall => mallSums[mall] > 0);
    
    let finalMalls = mallsWithData;
    if (budget && !isNaN(budget) && budget > 0) {
        let currentSum = 0;
        finalMalls = [];
        
        const sortedMalls = mallsWithData.sort((a, b) => (mallSums[a] || 0) - (mallSums[b] || 0));
        
        for (let mall of sortedMalls) {
            const mallCost = mallSums[mall] || 0;
            if (currentSum + mallCost <= budget) {
                currentSum += mallCost;
                finalMalls.push(mall);
            }
        }
    }
    
    if (finalMalls.length === 0) {
        document.getElementById('ganttResults').innerHTML = 
            '<div style="color:#dc3545; font-weight:bold; text-align:center; padding:20px;">לא נמצאו מתחמים תואמים לתקציב</div>';
        return;
    }
    
    // שמירת הנתונים הנוכחיים
    currentGanttData = {
        finalMalls,
        mallSums,
        mallCounts,
        mallProducts, // הוסף את המוצרים שנכללו בפועל
        type,
        budget,
        selectedMalls: Array.from(ganttSelectedMalls),
        generatedAt: new Date().toISOString()
    };
    
    // יצירת דוח תוצאות - העברת mallProducts לפונקציה
    generateGanttReport(finalMalls, mallSums, mallCounts, mallProducts, type, budget);
}

// פונקציה ליצירת דוח גנט
function generateGanttReport(finalMalls, mallSums, mallCounts, mallProducts, type, budget) {
    let totalCost = 0;
    let totalProducts = 0;
    
    // חישוב פלטפורמות שנכללו בפועל בגנט לכל מתחם
    let mallPlatforms = {};
    let mallProductsData = {}; // שינוי השם כדי למנוע התנגשות
    
    finalMalls.forEach(mall => {
        mallPlatforms[mall] = new Set();
        mallProductsData[mall] = [];
        
        productsData.forEach(p => {
            if (p['מתחם'] && p['מתחם'].trim() === mall) {
                const campaignStr = String(p['קמפיין'] || '').trim();
                
                // אותו תנאי סינון כמו בחישוב
                let includeProduct = true;
                if (type === 'פרינט') {
                    if (campaignStr !== 'פרינט') {
                        includeProduct = false;
                    }
                } else if (type === 'דיגיטלי') {
                    if (campaignStr !== 'דיגטלי') {
                        includeProduct = false;
                    }
                }
                
                if (includeProduct && p['פלטפורמה']) {
                    mallPlatforms[mall].add(p['פלטפורמה']);
                    mallProductsData[mall].push(p); // שמור את המוצר עבור ה-PDF
                }
            }
        });
    });
    
    let html = `
        <div style="background:white; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.1);" id="ganttReportContent">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin:0; color:#007bff;">תוצאות חישוב תקציב גנט</h4>
                <div style="display: flex; gap: 10px;">
                    <button onclick="saveGanttPlan()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">שמור תוכנית</button>
                    <button onclick="exportGanttToPDF(false)" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">PDF עם מחירים</button>
                </div>
            </div>
            
            <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span><strong>סוג קמפיין:</strong></span>
                    <span>${type === 'all' ? 'משולב (הכל)' : type}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span><strong>מתחמים בתקציב:</strong></span>
                    <span>${finalMalls.length}</span>
                </div>
            </div>
            
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <thead>
                    <tr style="background:#007bff; color:white;">
                        <th style="padding:12px; text-align:right;">מתחם</th>
                        <th style="padding:12px; text-align:center;">מוצרים</th>
                        <th style="padding:12px; text-align:center;">פלטפורמות</th>
                        <th style="padding:12px; text-align:center;">אחוז</th>
                        <th style="padding:12px; text-align:center;">עלות</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // מיון לפי עלות
    const sortedMalls = finalMalls.sort((a, b) => (mallSums[b] || 0) - (mallSums[a] || 0));
    
    sortedMalls.forEach((mall, index) => {
        const cost = mallSums[mall] || 0;
        const count = mallCounts[mall] || 0;
        totalCost += cost;
        totalProducts += count;
        
        const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
        const platforms = Array.from(mallPlatforms[mall] || []).join(', ') || 'לא זמין';
        
        html += `
            <tr style="background:${bgColor};">
                <td style="padding:10px; font-weight:500;">${mall}</td>
                <td style="padding:10px; text-align:center;">${count}</td>
                <td style="padding:10px; text-align:center; font-size:12px;">${platforms}</td>
                <td style="padding:10px; text-align:center;" id="percentage-${index}">-</td>
                <td style="padding:10px; text-align:center; font-weight:600; color:#007bff;">${cost.toLocaleString()}</td>
            </tr>
        `;
    });
    
    // עדכון אחוזים
    setTimeout(() => {
        sortedMalls.forEach((mall, index) => {
            const cost = mallSums[mall] || 0;
            const correctPercentage = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : 0;
            const percentageElement = document.getElementById(`percentage-${index}`);
            if (percentageElement) {
                percentageElement.textContent = correctPercentage + '%';
            }
        });
    }, 100);
    
    html += `
                <tr style="background:#28a745; color:white; font-weight:bold;">
                    <td style="padding:12px;">סהכ</td>
                    <td style="text-align:center; padding:12px;">${totalProducts}</td>
                    <td style="text-align:center; padding:12px;">-</td>
                    <td style="text-align:center; padding:12px;">100%</td>
                    <td style="text-align:center; padding:12px;">${totalCost.toLocaleString()}</td>
                </tr>
                </tbody>
            </table>
    `;
    
    // תקציב נותר
    if (budget && !isNaN(budget) && budget > 0) {
        const remaining = budget - totalCost;
        const usedPercentage = Math.round((totalCost / budget) * 100);
        
        html += `
            <div style="margin-top:20px; padding:15px; background:${remaining >= 0 ? '#d4edda' : '#f8d7da'}; border-radius:8px;">
                <h5 style="margin:0 0 10px 0;">סטטוס תקציב</h5>
                <div style="display:flex; justify-content:space-between;">
                    <span>תקציב: ${budget.toLocaleString()}</span>
                    <span>בשימוש: ${totalCost.toLocaleString()} (${usedPercentage}%)</span>
                    <span>${remaining >= 0 ? 'נותר' : 'חריגה'}: ${Math.abs(remaining).toLocaleString()}</span>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    document.getElementById('ganttResults').innerHTML = html;
}

// פונקציה לשמירת תוכנית
function saveGanttPlan() {
    if (!currentGanttData) {
        alert('אין תוכנית גנט לשמירה');
        return;
    }
    
    const planName = prompt('הכנס שם לתוכנית:', `תוכנית_${new Date().toLocaleDateString('he-IL')}`);
    if (!planName) return;
    
    const planToSave = {
        id: Date.now(),
        name: planName,
        data: currentGanttData,
        savedAt: new Date().toISOString()
    };
    
    savedGanttPlans.unshift(planToSave);
    if (savedGanttPlans.length > 10) savedGanttPlans.pop();
    
    alert('התוכנית נשמרה בהצלחה!');
}

// פונקציה ליצוא PDF
function exportGanttToPDF(withoutPrices = false) {
    if (!currentGanttData) {
        alert('אין נתוני גנט ליצוא');
        return;
    }
    
    const printWindow = window.open('', '', 'height=800,width=1000');
    const { finalMalls, mallSums, mallCounts, mallProducts, type, budget } = currentGanttData;
    let totalCost = Object.values(mallSums).reduce((a, b) => a + b, 0);
    let totalProducts = Object.values(mallCounts).reduce((a, b) => a + b, 0);
    
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>תוכנית גנט תקציב</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                h1 { text-align: center; color: #007bff; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 6px; border: 1px solid #ddd; text-align: right; font-size: 11px; }
                th { background-color: #007bff; color: white; font-weight: bold; }
                tr:nth-child(even) { background-color: #f8f9fa; }
                .summary { background: #f8f9fa; padding: 10px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>תוכנית גנט תקציב</h1>
            <div class="summary">
                <p><strong>תאריך:</strong> ${new Date().toLocaleDateString('he-IL')} | <strong>סוג קמפיין:</strong> ${type === 'all' ? 'משולב' : type}</p>
                <p><strong>מספר מתחמים:</strong> ${finalMalls.length} | <strong>סה"כ מוצרים:</strong> ${totalProducts}</p>
                ${!withoutPrices ? `<p><strong>סה"כ תקציב:</strong> ${totalCost.toLocaleString()} ₪</p>` : ''}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>מתחם</th>
                        <th>פלטפורמה</th>
                        <th>גובה</th>
                        <th>רוחב</th>
                        <th>גובה2</th>
                        <th>רוחב2</th>
                        <th>מבקרים</th>
                        ${!withoutPrices ? '<th>מחיר</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `);
    
    // יצירת טבלה מפורטת של כל המוצרים
    finalMalls.forEach(mall => {
        const products = mallProducts[mall] || [];
        
        products.forEach((product, index) => {
            const height1 = product['גובה'] || '-';
            const width1 = product['רוחב'] || '-';
            const height2 = product['גובה2'] || '-';
            const width2 = product['רוחב2'] || '-';
            const visitors = product['מבקרים'] || '-';
            const platform = product['פלטפורמה'] || '-';
            const price = !withoutPrices ? (product['מחיר מכירה'] || '0') : '';
            
            printWindow.document.write(`
                <tr>
                    ${index === 0 ? `<td rowspan="${products.length}" style="vertical-align: top; font-weight: bold;">${mall}</td>` : ''}
                    <td>${platform}</td>
                    <td>${height1}</td>
                    <td>${width1}</td>
                    <td>${height2 !== '-' ? height2 : ''}</td>
                    <td>${width2 !== '-' ? width2 : ''}</td>
                    <td>${visitors}</td>
                    ${!withoutPrices ? `<td>${typeof price === 'string' ? price : price.toLocaleString()}</td>` : ''}
                </tr>
            `);
        });
    });
    
    printWindow.document.write(`
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

// פונקציה לניקוי הטופס
function clearGanttForm() {
    selectedMalls.clear();
    updateMallsDisplay();
    updateMallsDropdown();
    
    const ganttType = document.getElementById('ganttType');
    const ganttBudget = document.getElementById('ganttBudget');
    const ganttResults = document.getElementById('ganttResults');
    
    if (ganttType) ganttType.value = 'all';
    if (ganttBudget) ganttBudget.value = '';
    if (ganttResults) ganttResults.innerHTML = '';
    
    currentGanttData = null;
}

// ============================================================
// 🚀 שדרוג מחשבון גנט - הוסף את הקוד הזה לסוף הקובץ הקיים
// ============================================================

// שמירה על הפונקציות הקיימות
const originalFunctions = {
    calculateGanttBudget: typeof calculateGanttBudget !== 'undefined' ? calculateGanttBudget : null,
    updateGanttMallOptions: typeof updateGanttMallOptions !== 'undefined' ? updateGanttMallOptions : null,
    clearGanttForm: typeof clearGanttForm !== 'undefined' ? clearGanttForm : null
};

// מנהל נתונים מותאם לקובץ הקיים
class EnhancedGanttManager {
    constructor() {
        this.isEnhanced = false;
        this.originalData = null;
        
        this.init();
    }
    
    init() {
        console.log('🔧 מאתחל שדרוגים למחשבון גנט...');
        
        // בדיקה אם יש נתונים קיימים
        if (typeof productsData !== 'undefined' && Array.isArray(productsData)) {
            this.originalData = productsData;
            this.isEnhanced = true;
            console.log('✅ נתונים קיימים זוהו:', productsData.length, 'פריטים');
        }
        
        this.enhanceExistingFunctions();
    }
    
    // שיפור הפונקציות הקיימות
    enhanceExistingFunctions() {
        // שדרוג פונקציית החישוב
        if (originalFunctions.calculateGanttBudget) {
            window.calculateGanttBudgetOriginal = originalFunctions.calculateGanttBudget;
            window.calculateGanttBudget = this.enhancedCalculate.bind(this);
        }
        
        // הוספת פונקציות חדשות
        window.ganttExportAdvanced = this.advancedExport.bind(this);
        window.ganttSaveAdvanced = this.advancedSave.bind(this);
        window.ganttShowStats = this.showStatistics.bind(this);
        window.ganttOptimizeBudget = this.optimizeBudget.bind(this);
    }
    
    // חישוב משופר עם שמירה על התאימות
    enhancedCalculate() {
        console.log('🎯 מבצע חישוב משופר...');
        
        const type = document.getElementById('ganttType')?.value || 'all';
        const budget = Number(document.getElementById('ganttBudget')?.value || 0);
        
        // בדיקות בסיסיות
        if (ganttSelectedMalls.size === 0) {
            this.showMessage('אנא בחר לפחות מתחם אחד', 'warning');
            return;
        }
        
        if (!this.originalData || this.originalData.length === 0) {
            // נפילה לפונקציה המקורית
            if (originalFunctions.calculateGanttBudget) {
                originalFunctions.calculateGanttBudget();
                return;
            }
        }
        
        // חישוב משופר
        const results = this.calculateEnhanced(type, budget);
        this.displayEnhancedResults(results);
    }
    
    calculateEnhanced(type, budget) {
        const selectedMalls = Array.from(ganttSelectedMalls);
        let mallStats = {};
        
        // עיבוד נתונים
        this.originalData.forEach(item => {
            const mall = item['מתחם'];
            if (!mall || !selectedMalls.includes(mall.trim())) return;
            
            // סינון לפי קמפיין
            const campaign = String(item['קמפיין'] || '').trim();
            if (type !== 'all') {
                if (type === 'פרינט' && campaign !== 'פרינט') return;
                if (type === 'דיגיטלי' && campaign !== 'דיגטלי') return;
            }
            
            const mallKey = mall.trim();
            if (!mallStats[mallKey]) {
                mallStats[mallKey] = {
                    cost: 0,
                    count: 0,
                    products: [],
                    platforms: new Set(),
                    visitors: 0
                };
            }
            
            const price = Number(item['מחיר מכירה']) || 0;
            const visitors = Number(item['מבקרים']) || 0;
            
            mallStats[mallKey].cost += price;
            mallStats[mallKey].count += 1;
            mallStats[mallKey].products.push(item);
            mallStats[mallKey].visitors += visitors;
            
            if (item['פלטפורמה']) {
                mallStats[mallKey].platforms.add(item['פלטפורמה']);
            }
        });
        
        // המרה למערך וסינון לפי תקציב
        let mallsArray = Object.keys(mallStats).map(mall => ({
            name: mall,
            cost: mallStats[mall].cost,
            count: mallStats[mall].count,
            products: mallStats[mall].products,
            platforms: Array.from(mallStats[mall].platforms),
            avgVisitors: mallStats[mall].count > 0 ? Math.round(mallStats[mall].visitors / mallStats[mall].count) : 0
        }));
        
        // סינון לפי תקציב
        if (budget && budget > 0) {
            mallsArray.sort((a, b) => a.cost - b.cost);
            let currentTotal = 0;
            mallsArray = mallsArray.filter(mall => {
                if (currentTotal + mall.cost <= budget) {
                    currentTotal += mall.cost;
                    return true;
                }
                return false;
            });
        }
        
        return {
            type,
            budget,
            malls: mallsArray,
            totalCost: mallsArray.reduce((sum, mall) => sum + mall.cost, 0),
            totalProducts: mallsArray.reduce((sum, mall) => sum + mall.count, 0),
            generatedAt: new Date()
        };
    }
    
    displayEnhancedResults(results) {
        const { malls, type, budget, totalCost, totalProducts } = results;
        
        // שמירת נתונים לתאימות
        currentGanttData = {
            finalMalls: malls.map(m => m.name),
            mallSums: Object.fromEntries(malls.map(m => [m.name, m.cost])),
            mallCounts: Object.fromEntries(malls.map(m => [m.name, m.count])),
            mallProducts: Object.fromEntries(malls.map(m => [m.name, m.products])),
            type,
            budget,
            selectedMalls: Array.from(ganttSelectedMalls),
            generatedAt: new Date().toISOString()
        };
        
        let html = `
            <div style="background:white; padding:25px; border-radius:16px; box-shadow:0 8px 25px rgba(0,0,0,0.1);" id="ganttReportContent">
                <!-- כותרת משופרת -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #e9ecef;">
                    <div>
                        <h4 style="margin:0; color:#007bff; font-size: 22px;">🎯 תוצאות גנט משופרות</h4>
                        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">נוצר ב-${new Date().toLocaleString('he-IL')}</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="ganttSaveAdvanced()" style="background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;">💾 שמור מתקדם</button>
                        <button onclick="ganttExportAdvanced('pdf')" style="background: linear-gradient(135deg, #dc3545, #e83e8c); color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;">📄 PDF</button>
                        <button onclick="ganttShowStats()" style="background: linear-gradient(135deg, #17a2b8, #6f42c1); color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;">📊 סטטיסטיקות</button>
                    </div>
                </div>
                
                <!-- כרטיסי סיכום -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 20px; border-radius: 12px; text-align: center; border-left: 4px solid #2196f3;">
                        <div style="font-size: 28px; font-weight: bold; color: #1976d2;">${malls.length}</div>
                        <div style="color: #1565c0; font-size: 14px; font-weight: 500;">מתחמים נבחרו</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #e8f5e8, #c8e6c9); padding: 20px; border-radius: 12px; text-align: center; border-left: 4px solid #4caf50;">
                        <div style="font-size: 28px; font-weight: bold; color: #2e7d32;">${totalProducts}</div>
                        <div style="color: #1b5e20; font-size: 14px; font-weight: 500;">סה"כ פלטפורמות</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #fff3e0, #ffcc02); padding: 20px; border-radius: 12px; text-align: center; border-left: 4px solid #ff9800;">
                        <div style="font-size: 28px; font-weight: bold; color: #f57c00;">₪${totalCost.toLocaleString()}</div>
                        <div style="color: #ef6c00; font-size: 14px; font-weight: 500;">השקעה כוללת</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #f3e5f5, #e1bee7); padding: 20px; border-radius: 12px; text-align: center; border-left: 4px solid #9c27b0;">
                        <div style="font-size: 18px; font-weight: bold; color: #7b1fa2;">${type === 'all' ? 'משולב' : type}</div>
                        <div style="color: #6a1b9a; font-size: 14px; font-weight: 500;">סוג קמפיין</div>
                    </div>
                </div>
        `;
        
        // טבלת תוצאות מפורטת
        html += this.generateDetailedTable(malls, totalCost);
        
        // סטטוס תקציב אם הוגדר
        if (budget && budget > 0) {
            html += this.generateBudgetStatus(budget, totalCost);
        }
        
        // גרף התפלגות פשוט
        html += this.generateSimpleChart(malls, totalCost);
        
        html += '</div>';
        
        document.getElementById('ganttResults').innerHTML = html;
        
        // אפקט אנימציה
        setTimeout(() => {
            const content = document.getElementById('ganttReportContent');
            if (content) {
                content.style.opacity = '0';
                content.style.transform = 'translateY(20px)';
                content.style.transition = 'all 0.6s ease';
                
                setTimeout(() => {
                    content.style.opacity = '1';
                    content.style.transform = 'translateY(0)';
                }, 50);
            }
        }, 100);
    }
    
    generateDetailedTable(malls, totalCost) {
        let html = `
            <table style="width:100%; border-collapse:collapse; margin-bottom:25px; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #007bff, #0056b3); color:white;">
                        <th style="padding:16px; text-align:right; font-weight:600; font-size:14px;">מתחם</th>
                        <th style="padding:16px; text-align:center; font-weight:600; font-size:14px;">פלטפורמות</th>
                        <th style="padding:16px; text-align:center; font-weight:600; font-size:14px;">סוגי מדיה</th>
                        <th style="padding:16px; text-align:center; font-weight:600; font-size:14px;">ממוצע מבקרים</th>
                        <th style="padding:16px; text-align:center; font-weight:600; font-size:14px;">אחוז מתקציב</th>
                        <th style="padding:16px; text-align:center; font-weight:600; font-size:14px;">עלות</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        malls.sort((a, b) => b.cost - a.cost).forEach((mall, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            const percentage = totalCost > 0 ? ((mall.cost / totalCost) * 100).toFixed(1) : '0.0';
            const platformsText = mall.platforms.length > 2 ? 
                mall.platforms.slice(0, 2).join(', ') + `... (+${mall.platforms.length - 2})` :
                mall.platforms.join(', ') || 'לא זמין';
            
            html += `
                <tr style="background:${bgColor}; transition:all 0.3s ease;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='${bgColor}'">
                    <td style="padding:14px; font-weight:600; color:#007bff; border-bottom:1px solid #e9ecef;">${mall.name}</td>
                    <td style="padding:14px; text-align:center; font-weight:500; border-bottom:1px solid #e9ecef;">${mall.count}</td>
                    <td style="padding:14px; text-align:center; font-size:12px; border-bottom:1px solid #e9ecef;" title="${mall.platforms.join(', ')}">${platformsText}</td>
                    <td style="padding:14px; text-align:center; font-weight:500; border-bottom:1px solid #e9ecef;">${mall.avgVisitors.toLocaleString()}</td>
                    <td style="padding:14px; text-align:center; font-weight:600; color:#28a745; border-bottom:1px solid #e9ecef;">${percentage}%</td>
                    <td style="padding:14px; text-align:center; font-weight:700; color:#007bff; border-bottom:1px solid #e9ecef;">₪${mall.cost.toLocaleString()}</td>
                </tr>
            `;
        });
        
        const totalProducts = malls.reduce((sum, mall) => sum + mall.count, 0);
        const avgVisitors = malls.length > 0 ? Math.round(malls.reduce((sum, mall) => sum + mall.avgVisitors, 0) / malls.length) : 0;
        
        html += `
                <tr style="background: linear-gradient(135deg, #28a745, #20c997); color:white; font-weight:bold;">
                    <td style="padding:16px; font-size:16px;"><strong>סה"כ</strong></td>
                    <td style="text-align:center; padding:16px; font-size:16px;"><strong>${totalProducts}</strong></td>
                    <td style="text-align:center; padding:16px; font-size:16px;"><strong>-</strong></td>
                    <td style="text-align:center; padding:16px; font-size:16px;"><strong>${avgVisitors.toLocaleString()}</strong></td>
                    <td style="text-align:center; padding:16px; font-size:16px;"><strong>100%</strong></td>
                    <td style="text-align:center; padding:16px; font-size:16px;"><strong>₪${totalCost.toLocaleString()}</strong></td>
                </tr>
                </tbody>
            </table>
        `;
        
        return html;
    }
    
    generateBudgetStatus(budget, totalCost) {
        const remaining = budget - totalCost;
        const usedPercentage = Math.round((totalCost / budget) * 100);
        const statusColor = remaining >= 0 ? '#d4edda' : '#f8d7da';
        const statusBorder = remaining >= 0 ? '#28a745' : '#dc3545';
        const statusIcon = remaining >= 0 ? '✅' : '⚠️';
        
        return `
            <div style="margin:25px 0; padding:25px; background:${statusColor}; border-left:6px solid ${statusBorder}; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <h5 style="margin:0 0 20px 0; color:${statusBorder}; display:flex; align-items:center; gap:12px; font-size:18px;">
                    <span style="font-size:24px;">${statusIcon}</span>
                    <span>סטטוס תקציב מתקדם</span>
                </h5>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:20px;">
                    <div style="background:rgba(255,255,255,0.8); padding:15px; border-radius:8px; text-align:center;">
                        <div style="font-size:14px; color:#6c757d; margin-bottom:5px;">תקציב מאושר</div>
                        <div style="font-size:20px; font-weight:bold; color:${statusBorder};">₪${budget.toLocaleString()}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.8); padding:15px; border-radius:8px; text-align:center;">
                        <div style="font-size:14px; color:#6c757d; margin-bottom:5px;">בשימוש</div>
                        <div style="font-size:20px; font-weight:bold; color:${statusBorder};">₪${totalCost.toLocaleString()}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.8); padding:15px; border-radius:8px; text-align:center;">
                        <div style="font-size:14px; color:#6c757d; margin-bottom:5px;">${remaining >= 0 ? 'יתרה' : 'חריגה'}</div>
                        <div style="font-size:20px; font-weight:bold; color:${statusBorder};">₪${Math.abs(remaining).toLocaleString()}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.8); padding:15px; border-radius:8px; text-align:center;">
                        <div style="font-size:14px; color:#6c757d; margin-bottom:5px;">אחוז ניצול</div>
                        <div style="font-size:20px; font-weight:bold; color:${statusBorder};">${usedPercentage}%</div>
                    </div>
                </div>
                
                <!-- פס התקדמות משופר -->
                <div style="background:rgba(255,255,255,0.6); border-radius:20px; height:24px; overflow:hidden; position:relative;">
                    <div style="background:linear-gradient(90deg, ${statusBorder}, ${statusBorder}dd); height:100%; width:${Math.min(usedPercentage, 100)}%; transition:width 2s ease; border-radius:20px; display:flex; align-items:center; justify-content:center;">
                        <span style="color:white; font-size:12px; font-weight:bold; text-shadow:1px 1px 2px rgba(0,0,0,0.3);">${usedPercentage}%</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateSimpleChart(malls, totalCost) {
        const topMalls = malls.sort((a, b) => b.cost - a.cost).slice(0, 5);
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d'];
        
        let html = `
            <div style="margin:25px 0;">
                <h5 style="color:#007bff; margin-bottom:20px; font-size:18px; display:flex; align-items:center; gap:10px;">
                    <span>📊</span>
                    <span>התפלגות תקציב - ${topMalls.length} המתחמים המובילים</span>
                </h5>
                <div style="background:linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius:16px; padding:25px; border:1px solid #dee2e6;">
        `;
        
        topMalls.forEach((mall, index) => {
            const percentage = totalCost > 0 ? ((mall.cost / totalCost) * 100) : 0;
            const width = Math.max(percentage, 3);
            
            html += `
                <div style="margin-bottom:16px; display:flex; align-items:center; gap:20px;">
                    <div style="min-width:140px; font-size:13px; font-weight:600; color:#495057;">${mall.name}</div>
                    <div style="flex:1; background:#ffffff; border-radius:12px; height:32px; position:relative; overflow:hidden; box-shadow:inset 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="background:linear-gradient(90deg, ${colors[index]}, ${colors[index]}cc); height:100%; width:${width}%; border-radius:12px; transition:width 2s ease; display:flex; align-items:center; justify-content:flex-end; padding-right:12px; position:relative;">
                            <span style="color:white; font-size:11px; font-weight:bold; text-shadow:1px 1px 2px rgba(0,0,0,0.4);">
                                ${percentage.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div style="min-width:90px; text-align:left; font-size:13px; font-weight:700; color:${colors[index]};">
                        ₪${mall.cost.toLocaleString()}
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }
    
    // שמירה מתקדמת
    advancedSave() {
        if (!currentGanttData) {
            this.showMessage('אין תוכנית לשמירה', 'error');
            return;
        }
        
        const timestamp = new Date().toISOString().split('T')[0];
        const defaultName = `גנט_${currentGanttData.type}_${timestamp}`;
        const planName = prompt('🏷️ הכנס שם לתוכנית:', defaultName);
        
        if (!planName) return;
        
        const enhancedPlan = {
            id: Date.now(),
            name: planName.trim(),
            data: {
                ...currentGanttData,
                metadata: {
                    version: '2.0',
                    enhanced: true,
                    totalMalls: currentGanttData.finalMalls ? currentGanttData.finalMalls.length : 0,
                    totalCost: Object.values(currentGanttData.mallSums || {}).reduce((sum, cost) => sum + cost, 0),
                    totalProducts: Object.values(currentGanttData.mallCounts || {}).reduce((sum, count) => sum + count, 0)
                }
            },
            savedAt: new Date().toISOString()
        };
        
        savedGanttPlans.unshift(enhancedPlan);
        if (savedGanttPlans.length > 50) savedGanttPlans.pop();
        
        try {
            localStorage.setItem('savedGanttPlans', JSON.stringify(savedGanttPlans));
            this.showMessage(`✅ התוכנית "${planName}" נשמרה בהצלחה!`, 'success');
        } catch (e) {
            this.showMessage('⚠️ שגיאה בשמירה', 'error');
        }
    }
    
    // יצוא מתקדם
    advancedExport(format = 'pdf') {
        if (!currentGanttData) {
            this.showMessage('אין נתונים לייצוא', 'error');
            return;
        }
        
        if (format === 'pdf') {
            // השתמש בפונקציה הקיימת עם שיפורים
            exportGanttToPDF(false);
        } else if (format === 'excel') {
            this.exportToExcel();
        }
    }
    
    // הצגת סטטיסטיקות
    showStatistics() {
        if (!this.originalData) {
            this.showMessage('אין נתונים זמינים', 'error');
            return;
        }
        
        const stats = this.calculateStatistics();
        this.displayStatistics(stats);
    }
    
    calculateStatistics() {
        const malls = new Set();
        const campaigns = new Set();
        const platforms = new Set();
        const prices = [];
        
        this.originalData.forEach(item => {
            if (item['מתחם']) malls.add(item['מתחם']);
            if (item['קמפיין']) campaigns.add(item['קמפיין']);
            if (item['פלטפורמה']) platforms.add(item['פלטפורמה']);
            
            const price = Number(item['מחיר מכירה']);
            if (!isNaN(price) && price > 0) {
                prices.push(price);
            }
        });
        
        return {
            totalItems: this.originalData.length,
            totalMalls: malls.size,
            totalCampaigns: campaigns.size,
            totalPlatforms: platforms.size,
            campaigns: Array.from(campaigns),
            priceStats: {
                min: Math.min(...prices),
                max: Math.max(...prices),
                avg: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
                total: prices.reduce((sum, price) => sum + price, 0)
            }
        };
    }
    
    displayStatistics(stats) {
        const modalHtml = `
            <div id="statsModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; display:flex; align-items:center; justify-content:center;">
                <div style="background:white; padding:30px; border-radius:16px; max-width:600px; width:90%; max-height:80%; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <h3 style="margin:0; color:#007bff; font-size:20px;">📊 סטטיסטיקות מערכת</h3>
                        <button onclick="document.getElementById('statsModal').remove()" style="background:none; border:none; font-size:28px; cursor:pointer; color:#6c757d; padding:0; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">×</button>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:20px; margin-bottom:25px;">
                        <div style="background:linear-gradient(135deg, #e3f2fd, #bbdefb); padding:20px; border-radius:12px; text-align:center;">
                            <div style="font-size:28px; font-weight:bold; color:#1976d2;">${stats.totalItems}</div>
                            <div style="color:#1565c0; font-size:14px;">סה"כ פלטפורמות</div>
                        </div>
                        <div style="background:linear-gradient(135deg, #e8f5e8, #c8e6c9); padding:20px; border-radius:12px; text-align:center;">
                            <div style="font-size:28px; font-weight:bold; color:#2e7d32;">${stats.totalMalls}</div>
                            <div style="color:#1b5e20; font-size:14px;">מתחמים</div>
                        </div>
                        <div style="background:linear-gradient(135deg, #fff3e0, #ffcc02); padding:20px; border-radius:12px; text-align:center;">
                            <div style="font-size:28px; font-weight:bold; color:#f57c00;">${stats.totalPlatforms}</div>
                            <div style="color:#ef6c00; font-size:14px;">סוגי פלטפורמות</div>
                        </div>
                    </div>
                    
                    <div style="background:#f8f9fa; padding:20px; border-radius:12px; margin-bottom:20px;">
                        <h5 style="color:#007bff; margin-bottom:15px;">💰 סטטיסטיקות מחירים</h5>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:15px;">
                            <div style="text-align:center;">
                                <div style="font-size:18px; font-weight:bold; color:#28a745;">₪${stats.priceStats.min.toLocaleString()}</div>
                                <div style="font-size:12px; color:#6c757d;">מינימום</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:18px; font-weight:bold; color:#ffc107;">₪${stats.priceStats.avg.toLocaleString()}</div>
                                <div style="font-size:12px; color:#6c757d;">ממוצע</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:18px; font-weight:bold; color:#dc3545;">₪${stats.priceStats.max.toLocaleString()}</div>
                                <div style="font-size:12px; color:#6c757d;">מקסימום</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:18px; font-weight:bold; color:#007bff;">₪${stats.priceStats.total.toLocaleString()}</div>
                                <div style="font-size:12px; color:#6c757d;">סה"כ ערך</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background:#f8f9fa; padding:20px; border-radius:12px;">
                        <h5 style="color:#007bff; margin-bottom:15px;">🎯 סוגי קמפיינים</h5>
                        <div style="display:flex; gap:15px; flex-wrap:wrap;">
                            ${stats.campaigns.map(campaign => 
                                `<span style="background:#007bff; color:white; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:500;">${campaign}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    // אופטימיזציה של תקציב
    optimizeBudget() {
        const budget = Number(document.getElementById('ganttBudget')?.value || 0);
        if (!budget || budget <= 0) {
            this.showMessage('אנא הגדר תקציב תקף לאופטימיזציה', 'warning');
            return;
        }
        
        if (ganttSelectedMalls.size === 0) {
            this.showMessage('אנא בחר מתחמים לאופטימיזציה', 'warning');
            return;
        }
        
        const optimized = this.calculateOptimization(budget);
        this.showOptimizationResults(optimized);
    }
    
    calculateOptimization(budget) {
        const type = document.getElementById('ganttType')?.value || 'all';
        const selectedMalls = Array.from(ganttSelectedMalls);
        
        // חישוב 3 אסטרטגיות
        const strategies = {
            maxMalls: this.optimizeForMaxMalls(selectedMalls, budget, type),
            maxValue: this.optimizeForMaxValue(selectedMalls, budget, type),
            maxVisitors: this.optimizeForMaxVisitors(selectedMalls, budget, type)
        };
        
        return strategies;
    }
    
    optimizeForMaxMalls(selectedMalls, budget, type) {
        return this.getOptimizedResults(selectedMalls, budget, type, 'cost');
    }
    
    optimizeForMaxValue(selectedMalls, budget, type) {
        return this.getOptimizedResults(selectedMalls, budget, type, 'efficiency');
    }
    
    optimizeForMaxVisitors(selectedMalls, budget, type) {
        return this.getOptimizedResults(selectedMalls, budget, type, 'visitors');
    }
    
    getOptimizedResults(selectedMalls, budget, type, sortBy) {
        let mallStats = {};
        
        this.originalData.forEach(item => {
            const mall = item['מתחם'];
            if (!mall || !selectedMalls.includes(mall.trim())) return;
            
            const campaign = String(item['קמפיין'] || '').trim();
            if (type !== 'all') {
                if (type === 'פרינט' && campaign !== 'פרינט') return;
                if (type === 'דיגיטלי' && campaign !== 'דיגטלי') return;
            }
            
            const mallKey = mall.trim();
            if (!mallStats[mallKey]) {
                mallStats[mallKey] = { cost: 0, count: 0, visitors: 0 };
            }
            
            mallStats[mallKey].cost += Number(item['מחיר מכירה']) || 0;
            mallStats[mallKey].count += 1;
            mallStats[mallKey].visitors += Number(item['מבקרים']) || 0;
        });
        
        let mallsArray = Object.keys(mallStats).map(mall => ({
            name: mall,
            cost: mallStats[mall].cost,
            count: mallStats[mall].count,
            visitors: mallStats[mall].visitors,
            efficiency: mallStats[mall].cost > 0 ? mallStats[mall].count / mallStats[mall].cost : 0
        }));
        
        // מיון לפי אסטרטגיה
        switch(sortBy) {
            case 'cost':
                mallsArray.sort((a, b) => a.cost - b.cost);
                break;
            case 'efficiency':
                mallsArray.sort((a, b) => b.efficiency - a.efficiency);
                break;
            case 'visitors':
                mallsArray.sort((a, b) => b.visitors - a.visitors);
                break;
        }
        
        // בחירת מתחמים בתקציב
        const selected = [];
        let currentTotal = 0;
        
        for (const mall of mallsArray) {
            if (currentTotal + mall.cost <= budget) {
                currentTotal += mall.cost;
                selected.push(mall);
            }
        }
        
        return {
            malls: selected,
            totalCost: currentTotal,
            totalProducts: selected.reduce((sum, mall) => sum + mall.count, 0),
            totalVisitors: selected.reduce((sum, mall) => sum + mall.visitors, 0),
            remaining: budget - currentTotal
        };
    }
    
    showOptimizationResults(strategies) {
        const modalHtml = `
            <div id="optimizationModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; display:flex; align-items:center; justify-content:center;">
                <div style="background:white; padding:30px; border-radius:16px; max-width:800px; width:95%; max-height:90%; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <h3 style="margin:0; color:#007bff; font-size:20px;">🎯 אופטימיזציית תקציב</h3>
                        <button onclick="document.getElementById('optimizationModal').remove()" style="background:none; border:none; font-size:28px; cursor:pointer; color:#6c757d;">×</button>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:20px;">
                        ${this.generateStrategyCard('מקסימום מתחמים', strategies.maxMalls, '#007bff', 'maxMalls')}
                        ${this.generateStrategyCard('מקסימום יעילות', strategies.maxValue, '#28a745', 'maxValue')}
                        ${this.generateStrategyCard('מקסימום מבקרים', strategies.maxVisitors, '#dc3545', 'maxVisitors')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    generateStrategyCard(title, strategy, color, id) {
        return `
            <div style="border:2px solid ${color}; border-radius:12px; overflow:hidden; background:white;">
                <div style="background:${color}; color:white; padding:15px; text-align:center;">
                    <h5 style="margin:0; font-size:16px;">${title}</h5>
                </div>
                <div style="padding:20px;">
                    <div style="display:grid; gap:12px; margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>מתחמים:</span>
                            <strong>${strategy.malls.length}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span>פלטפורמות:</span>
                            <strong>${strategy.totalProducts}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span>עלות:</span>
                            <strong style="color:${color};">₪${strategy.totalCost.toLocaleString()}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span>יתרה:</span>
                            <strong style="color:#28a745;">₪${strategy.remaining.toLocaleString()}</strong>
                        </div>
                    </div>
                    <button onclick="ganttEnhanced.applyOptimization('${id}', ${JSON.stringify(strategy).replace(/"/g, '&quot;')})" style="width:100%; background:${color}; color:white; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:600;">
                        ✅ החל אסטרטגיה
                    </button>
                </div>
            </div>
        `;
    }
    
    applyOptimization(strategyId, strategyData) {
        // ניקוי בחירה נוכחית
        ganttSelectedMalls.clear();
        
        // הוספת מתחמים מהאסטרטגיה
        strategyData.malls.forEach(mall => {
            ganttSelectedMalls.add(mall.name);
        });
        
        // עדכון תצוגה
        updateMallsDisplay();
        updateMallsDropdown();
        
        // סגירת המודל
        document.getElementById('optimizationModal')?.remove();
        
        // הצגת הודעה
        this.showMessage(`✅ אסטרטגיה יושמה בהצלחה! נבחרו ${strategyData.malls.length} מתחמים`, 'success');
        
        // חישוב אוטומטי
        setTimeout(() => {
            this.enhancedCalculate();
        }, 1000);
    }
    
    // פונקציית עזר להצגת הודעות
    showMessage(message, type = 'info') {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#007bff'
        };
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            font-weight: 600;
            font-size: 14px;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        messageDiv.innerHTML = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
    
    // יצוא ל-Excel משופר
    exportToExcel() {
        if (!currentGanttData) {
            this.showMessage('אין נתונים לייצוא', 'error');
            return;
        }
        
        const { finalMalls, mallProducts, type } = currentGanttData;
        const exportData = [];
        
        // כותרת ראשית
        exportData.push(['תוכנית גנט משופרת', '', '', '', '', '', '', '']);
        exportData.push([`תאריך: ${new Date().toLocaleDateString('he-IL')}`, '', '', '', '', '', '', '']);
        exportData.push([`סוג קמפיין: ${type === 'all' ? 'משולב' : type}`, '', '', '', '', '', '', '']);
        exportData.push(['']); // שורה ריקה
        
        // כותרות עמודות
        exportData.push(['מתחם', 'פלטפורמה', 'מחיר', 'מבקרים', 'גובה', 'רוחב', 'גובה2', 'רוחב2', 'קמפיין']);
        
        // נתונים
        finalMalls.forEach(mall => {
            const products = mallProducts[mall] || [];
            products.forEach(product => {
                exportData.push([
                    mall,
                    product['פלטפורמה'] || '',
                    product['מחיר מכירה'] || 0,
                    product['מבקרים'] || '',
                    product['גובה'] || '',
                    product['רוחב'] || '',
                    product['גובה2'] || '',
                    product['רוחב2'] || '',
                    product['קמפיין'] || ''
                ]);
            });
        });
        
        // המרה ל-CSV עם BOM לתמיכה בעברית
        const csvContent = '\ufeff' + exportData.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `gantt_enhanced_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.showMessage('📊 קובץ Excel יוצא בהצלחה!', 'success');
    }
}

// יצירת instance גלובלי
const ganttEnhanced = new EnhancedGanttManager();

// הוספת CSS לאנימציות
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(styleSheet);

// ייצוא לגלובל
if (typeof window !== 'undefined') {
    window.ganttEnhanced = ganttEnhanced;
}

console.log('🚀 שדרוגי גנט הותקנו בהצלחה!');
console.log('📋 פונקציות זמינות:');
console.log('   • ganttShowStats() - הצגת סטטיסטיקות');
console.log('   • ganttOptimizeBudget() - אופטימיזציית תקציב');
console.log('   • ganttSaveAdvanced() - שמירה מתקדמת');
console.log('   • ganttExportAdvanced() - יצוא משופר');
