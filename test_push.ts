import webpush from 'web-push';
console.log('Webpush default:', webpush);
console.log('Webpush keys:', Object.keys(webpush || {}));
