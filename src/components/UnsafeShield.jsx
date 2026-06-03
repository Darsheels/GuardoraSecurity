export default function UnsafeShield() {
    return (
        <svg className="UnsafeShield" viewBox="0 0 100 100" width="120" height="120">
            <path className="DangShield" d="M50 10 L80 20 V45 C80 65 68 82 50 90 C32 82 20 65 20 45 V20 Z"/>
            <line className="Cross1" x1="30" y1="30" x2="70" y2="70"/>
            <line className="Cross2" x1="70" y1="30" x2="30" y2="70"/>
        </svg>
    );
}