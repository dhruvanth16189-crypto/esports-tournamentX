export function generateUPIDeepLink(payeeVPA: string, amount: number, appName: string = 'Free Fire Tournament'): string {
  const pa = encodeURIComponent(payeeVPA);
  const pn = encodeURIComponent(appName);
  const am = encodeURIComponent(amount.toString());
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR`;
}
