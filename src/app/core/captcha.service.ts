import { Injectable } from '@angular/core';

interface Captcha {
  img: string;
  resultado: number;
}

@Injectable({
  providedIn: 'root'
})
export class CaptchaService {
  private captchas: Captcha[] = [
    { img: '2+3.png', resultado: 5 },
    { img: '5+1.png', resultado: 6 },
    { img: '7+2.png', resultado: 9 },
    { img: '4+4.png', resultado: 8 },
    { img: '6+0.png', resultado: 6 }
  ];

  private currentCaptcha!: Captcha;

  constructor() {
    this.generarCaptcha();
  }

  generarCaptcha() {
    const index = Math.floor(Math.random() * this.captchas.length);
    this.currentCaptcha = this.captchas[index];
  }

  getCaptchaImagenUrl(): string {
    return `https://oqnisprjqxdarqewgqqu.supabase.co/storage/v1/object/public/captcha/${this.currentCaptcha.img}`;
  }

  validarRespuesta(respuesta: number | null): boolean {
    if (respuesta === null) return false;
    return Number(respuesta) === this.currentCaptcha.resultado;
  }
}
