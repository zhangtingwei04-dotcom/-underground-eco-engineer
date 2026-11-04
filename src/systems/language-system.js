// 鱗片與種子：地下生態物語
// Language System - English / Traditional Chinese

export class LanguageSystem {

    static STORAGE_KEY = 'scales_seeds_language';

    static DEFAULT_LANGUAGE = 'en';

    static translations = {

        en: {
            gameTitle: 'Scales & Seeds',
            gameSubtitle: 'Underground Ecosystem Tales',
            welcome: 'Welcome to Your Underground World',
            welcomeMessage: 'Every scale tells a story. Every seed holds the promise of life.',

            startExploring: 'Start Exploring',
            login: 'Log In',
            createAccount: 'Create Account',
            logout: 'Log Out',

            email: 'Email Address',
            password: 'Password',
            confirmPassword: 'Confirm Password',

            language: 'Language',
            english: 'English',
            traditionalChinese: 'Traditional Chinese',

            continueAsGuest: 'Continue as Guest',
            back: 'Back',
            confirm: 'Confirm',
            cancel: 'Cancel',

            loading: 'Loading...',
            loginSuccess: 'Login successful!',
            loginFailed: 'Login failed. Please try again.',
            registerSuccess: 'Account created successfully!',
            registerFailed: 'Account registration failed.',

            guestMode: 'Guest Mode',
            cloudSave: 'Cloud Save',
            localSave: 'Local Save',

            settings: 'Settings',
            saveSettings: 'Save Settings'
        },

        'zh-TW': {
            gameTitle: '鱗片與種子',
            gameSubtitle: '地下生態物語',
            welcome: '歡迎來到你的地下生態世界',
            welcomeMessage: '每一片鱗片，都有自己的故事；每一顆種子，都蘊藏著生命。',

            startExploring: '開始探索',
            login: '登入帳號',
            createAccount: '建立新帳號',
            logout: '登出',

            email: '電子郵件',
            password: '密碼',
            confirmPassword: '確認密碼',

            language: '語言',
            english: '英文',
            traditionalChinese: '繁體中文',

            continueAsGuest: '以訪客身分繼續',
            back: '返回',
            confirm: '確認',
            cancel: '取消',

            loading: '載入中...',
            loginSuccess: '登入成功！',
            loginFailed: '登入失敗，請重新嘗試。',
            registerSuccess: '帳號建立成功！',
            registerFailed: '帳號註冊失敗。',

            guestMode: '訪客模式',
            cloudSave: '雲端存檔',
            localSave: '本機存檔',

            settings: '設定',
            saveSettings: '儲存設定'
        }
    };

    /**
     * 取得目前語言
     */
    static getLanguage() {

        try {
            const savedLanguage = localStorage.getItem(
                this.STORAGE_KEY
            );

            if (
                savedLanguage &&
                this.translations[savedLanguage]
            ) {
                return savedLanguage;
            }

        } catch (error) {
            console.warn(
                '[LanguageSystem] 無法讀取語言設定:',
                error
            );
        }

        return this.DEFAULT_LANGUAGE;
    }

    /**
     * 設定遊戲語言
     */
    static setLanguage(language) {

        if (!this.translations[language]) {
            console.warn(
                '[LanguageSystem] 不支援的語言:',
                language
            );

            return false;
        }

        try {
            localStorage.setItem(
                this.STORAGE_KEY,
                language
            );

            window.dispatchEvent(
                new CustomEvent('languageChanged', {
                    detail: { language }
                })
            );

            console.log(
                `[LanguageSystem] 語言已切換為 ${language}`
            );

            return true;

        } catch (error) {
            console.error(
                '[LanguageSystem] 語言設定儲存失敗:',
                error
            );

            return false;
        }
    }

    /**
     * 取得翻譯文字
     */
    static t(key) {

        const language = this.getLanguage();

        const currentTranslations =
            this.translations[language];

        return (
            currentTranslations[key] ??
            this.translations.en[key] ??
            key
        );
    }

    /**
     * 取得所有支援的語言
     */
    static getAvailableLanguages() {

        return [
            {
                code: 'en',
                name: 'English'
            },
            {
                code: 'zh-TW',
                name: '繁體中文'
            }
        ];
    }

    /**
     * 判斷目前是否使用英文
     */
    static isEnglish() {
        return this.getLanguage() === 'en';
    }

    /**
     * 判斷目前是否使用繁體中文
     */
    static isTraditionalChinese() {
        return this.getLanguage() === 'zh-TW';
    }
}