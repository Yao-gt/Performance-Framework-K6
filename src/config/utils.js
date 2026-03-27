export function formatNameFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const testName = __ENV.TEST_NAME || 'test'
    return `${testName}_${timestamp}`;
}