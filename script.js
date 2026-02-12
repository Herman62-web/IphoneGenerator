document.addEventListener('DOMContentLoaded', function() {
    const themePaletteBtn = document.getElementById('themePaletteBtn');
    const colorPaletteModal = document.getElementById('colorPaletteModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const applyBtn = document.getElementById('applyBtn');
    const colorOptions = document.querySelectorAll('.color-option');
    const bratBtn = document.getElementById('bratBtn');
    const iqcBtn = document.getElementById('iqcBtn');
    const textInput = document.getElementById('textInput');
    const generateBtn = document.getElementById('generateBtn');
    const resultBox = document.getElementById('resultBox');
    const initialState = document.getElementById('initialState');
    const loadingState = document.getElementById('loadingState');
    const resultImage = document.getElementById('resultImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const headerTitle = document.querySelector('.header-title h1');
    const iqcExtraInputs = document.getElementById('iqcExtraInputs');
    const jamInput = document.getElementById('jamInput');
    const bateraiInput = document.getElementById('bateraiInput');
    const bateraiValue = document.getElementById('bateraiValue');
    const alertModal = document.getElementById('alertModal');
    const alertOkBtn = document.getElementById('alertOkBtn');
    const alertMessage = document.getElementById('alertMessage');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    let currentMode = 'brat';
    let currentColor = '#3b82f6';
    let selectedColor = '#3b82f6';
    let generatedImageUrl = null;
    let isGenerating = false;
    
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    function applyThemeColor(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        currentColor = color;
        
        const rgb = hexToRgb(color);
        if (rgb) {
            const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
            document.documentElement.style.setProperty('--primary-color-rgb', rgbString);
        }
        
        const activeColorOption = document.querySelector('.color-option.active');
        if (activeColorOption) {
            activeColorOption.classList.remove('active');
        }
        
        const newActiveColorOption = document.querySelector(`.color-option[data-color="${color}"]`);
        if (newActiveColorOption) {
            newActiveColorOption.classList.add('active');
        }
        
        updateHeaderTitle();
        updateModeButtons();
        
        applyBtn.style.backgroundColor = color;
    }
    
    function updateHeaderTitle() {
        headerTitle.innerHTML = '';
        
        const titleText = 'iPhone Generator';
        const words = titleText.split(' ');
        
        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word + (index < words.length - 1 ? ' ' : '');
            
            if (word.toLowerCase() === 'iphone') {
                span.style.color = currentColor;
                span.style.fontWeight = '700';
            }
            
            headerTitle.appendChild(span);
        });
    }
    
    function updateModeButtons() {
        if (currentMode === 'brat') {
            bratBtn.classList.add('active');
            iqcBtn.classList.remove('active');
            resultBox.classList.remove('vertical');
            resultBox.classList.add('square');
            iqcExtraInputs.style.display = 'none';
        } else {
            iqcBtn.classList.add('active');
            bratBtn.classList.remove('active');
            resultBox.classList.remove('square');
            resultBox.classList.add('vertical');
            iqcExtraInputs.style.display = 'flex';
        }
        
        bratBtn.style.backgroundColor = '';
        iqcBtn.style.backgroundColor = '';
    }
    
    function showLoading() {
        isGenerating = true;
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;
        initialState.style.display = 'none';
        loadingState.style.display = 'flex';
        resultImage.style.display = 'none';
        downloadBtn.disabled = true;
    }
    
    function hideLoading() {
        isGenerating = false;
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
        loadingState.style.display = 'none';
    }
    
    function showResult(imageUrl) {
        resultImage.src = imageUrl;
        resultImage.style.display = 'block';
        generatedImageUrl = imageUrl;
        downloadBtn.disabled = false;
    }
    
    function resetToInitialState() {
        initialState.style.display = 'flex';
        loadingState.style.display = 'none';
        resultImage.style.display = 'none';
        generatedImageUrl = null;
        downloadBtn.disabled = true;
        
        if (currentMode === 'iqc') {
            jamInput.value = '10:30';
            bateraiInput.value = '80';
            bateraiValue.textContent = '80%';
        }
    }
    
    function showAlert(message) {
        alertMessage.textContent = message;
        alertModal.classList.add('active');
    }
    
    function generateImage() {
        if (isGenerating) return;
        
        const text = textInput.value.trim();
        
        if (!text) {
            showAlert('Ups! Input masih kosong. Silakan ketik kalimat yang ingin digenerate.');
            textInput.focus();
            return;
        }
        
        showLoading();
        
        const encodedText = encodeURIComponent(text);
        let apiUrl;
        
        if (currentMode === 'brat') {
            apiUrl = `https://api-faa.my.id/faa/brathd?text=${encodedText}`;
        } else {
            const jam = jamInput.value || '10:30';
            const batre = bateraiInput.value + '%' || '80%';
            apiUrl = `https://api-faa.my.id/faa/iqcv2?prompt=${encodedText}&jam=${encodeURIComponent(jam)}&batre=${encodeURIComponent(batre)}`;
        }
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        fetch(apiUrl, {
            method: 'GET',
            mode: 'cors',
            signal: controller.signal,
            headers: {
                'Accept': 'image/*'
            }
        })
            .then(response => {
                clearTimeout(timeout);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('image')) {
                    return response.text().then(text => {
                        throw new Error(`Expected image but got: ${contentType}. Response: ${text.substring(0, 100)}`);
                    });
                }
                return response.blob();
            })
            .then(blob => {
                if (blob.size === 0) {
                    throw new Error('Empty image received');
                }
                const imageUrl = URL.createObjectURL(blob);
                showResult(imageUrl);
                hideLoading();
            })
            .catch(error => {
                clearTimeout(timeout);
                console.error('Error:', error);
                hideLoading();
                
                let errorMessage = 'Gagal memproses gambar. Coba lagi.';
                
                if (error.name === 'AbortError') {
                    errorMessage = 'Timeout: Permintaan terlalu lama. Coba lagi.';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Koneksi gagal. Periksa internet Anda.';
                }
                
                loadingState.innerHTML = `
                    <div style="text-align: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                        <p style="color: #ef4444;">${errorMessage}</p>
                        <button id="retryBtn" style="margin-top: 15px; padding: 10px 20px; background-color: ${currentColor}; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Coba Lagi
                        </button>
                    </div>
                `;
                
                document.getElementById('retryBtn').addEventListener('click', generateImage);
            });
    }
    
    function downloadImage() {
        if (!generatedImageUrl) return;
        
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        link.download = `iphone-generator-${currentMode}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    darkModeToggle.addEventListener('click', function() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        if (isDarkMode) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('darkMode', 'false');
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('darkMode', 'true');
        }
        applyThemeColor(currentColor);
    });
    
    themePaletteBtn.addEventListener('click', function() {
        colorPaletteModal.classList.add('active');
    });
    
    cancelBtn.addEventListener('click', function() {
        colorPaletteModal.classList.remove('active');
        
        const activeColorOption = document.querySelector('.color-option.active');
        if (activeColorOption) {
            selectedColor = activeColorOption.dataset.color;
        }
    });
    
    applyBtn.addEventListener('click', function() {
        applyThemeColor(selectedColor);
        colorPaletteModal.classList.remove('active');
        
        localStorage.setItem('themeColor', selectedColor);
        localStorage.setItem('themeColorRGB', JSON.stringify(hexToRgb(selectedColor)));
    });
    
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            selectedColor = this.dataset.color;
            
            applyBtn.style.backgroundColor = selectedColor;
        });
    });
    
    bratBtn.addEventListener('click', function() {
        currentMode = 'brat';
        updateModeButtons();
        localStorage.setItem('currentMode', currentMode);
        resetToInitialState();
    });
    
    iqcBtn.addEventListener('click', function() {
        currentMode = 'iqc';
        updateModeButtons();
        localStorage.setItem('currentMode', currentMode);
        resetToInitialState();
    });
    
    generateBtn.addEventListener('click', generateImage);
    
    downloadBtn.addEventListener('click', downloadImage);
    
    alertOkBtn.addEventListener('click', function() {
        alertModal.classList.remove('active');
        textInput.focus();
    });
    
    textInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateImage();
        }
    });
    
    bateraiInput.addEventListener('input', function() {
        bateraiValue.textContent = this.value + '%';
    });
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'false') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    const savedColor = localStorage.getItem('themeColor');
    if (savedColor) {
        applyThemeColor(savedColor);
        selectedColor = savedColor;
    }
    
    const savedMode = localStorage.getItem('currentMode');
    if (savedMode) {
        currentMode = savedMode;
        updateModeButtons();
    }
    
    updateHeaderTitle();
    
    window.addEventListener('click', function(event) {
        if (event.target === colorPaletteModal) {
            colorPaletteModal.classList.remove('active');
            
            const activeColorOption = document.querySelector('.color-option.active');
            if (activeColorOption) {
                selectedColor = activeColorOption.dataset.color;
            }
        }
        
        if (event.target === alertModal) {
            alertModal.classList.remove('active');
        }
    });
    
    textInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    if (textInput.value) {
        textInput.style.height = 'auto';
        textInput.style.height = (textInput.scrollHeight) + 'px';
    }
    
    window.addEventListener('resize', function() {
        textInput.style.height = 'auto';
        textInput.style.height = (textInput.scrollHeight) + 'px';
    });
    
    updateModeButtons();
    resetToInitialState();
});
