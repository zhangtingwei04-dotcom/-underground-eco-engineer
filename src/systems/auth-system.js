// 鱗片與種子：地下生態物語
// Supabase 使用者登入與身分驗證系統

export class AuthSystem {

    constructor() {
        const supabaseUrl = window.ENV_SUPABASE_URL || '';
        const supabaseKey = window.ENV_SUPABASE_KEY || '';

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase 連線設定不完整。');
        }

        if (!window.supabase || !window.supabase.createClient) {
            throw new Error('Supabase SDK 尚未載入。');
        }

        this.client = window.supabase.createClient(
            supabaseUrl,
            supabaseKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
    }

    // 使用電子郵件及密碼登入
    async signIn(email, password) {
        const { data, error } =
            await this.client.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

        if (error) {
            throw error;
        }

        return data;
    }

    // 建立新帳號
    async signUp(email, password) {
        const { data, error } =
            await this.client.auth.signUp({
                email: email.trim(),
                password: password
            });

        if (error) {
            throw error;
        }

        return data;
    }

    // 取得目前登入狀態
    async getSession() {
        const { data, error } =
            await this.client.auth.getSession();

        if (error) {
            throw error;
        }

        return data.session;
    }

    // 取得目前登入使用者
    async getCurrentUser() {
        const { data, error } =
            await this.client.auth.getUser();

        if (error) {
            throw error;
        }

        return data.user;
    }

    // 登出
    async signOut() {
        const { error } =
            await this.client.auth.signOut();

        if (error) {
            throw error;
        }

        return true;
    }

    // 監聽登入狀態變化
    onAuthStateChange(callback) {
        const { data } =
            this.client.auth.onAuthStateChange(
                (event, session) => {
                    callback(event, session);
                }
            );

        return data.subscription;
    }
}