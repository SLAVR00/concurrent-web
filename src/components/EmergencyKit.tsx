export function EmergencyKit(): JSX.Element {
    const gracefulResetLocalStorage = (): void => {
        for (const key in localStorage) {
            if (['PrivateKey', 'PublicKey', 'Address', 'ServerAddress'].includes(key)) continue
            localStorage.removeItem(key)
        }
    }

    const resetAllLocalstorage = (): void => {
        for (const key in localStorage) {
            localStorage.removeItem(key)
        }
    }
    return (
        <>
            <h1>Emergency!</h1>
            何かしらのエラーが発生しました。
            <button
                style={{ height: '100px', width: '100%' }}
                onClick={(): void => {
                    window.location.reload()
                }}
            >
                とりあえずリロード
            </button>
            <h2>Medical Kit</h2>
            <div>3回くらいリロードしても解決しないなら↓</div>
            <div>
                <button onClick={gracefulResetLocalStorage}>
                    アカウント情報以外のlocalstorageをすべてリセットする
                </button>
            </div>
            <div>
                <button onClick={resetAllLocalstorage}>localStorageをすべてリセットする</button>
            </div>
        </>
    )
}
