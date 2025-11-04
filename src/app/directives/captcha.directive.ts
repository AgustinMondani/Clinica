import { Directive, ElementRef, Renderer2, HostListener, Output, EventEmitter, OnInit } from '@angular/core';
import { CaptchaService } from '../core/captcha.service';

@Directive({
  selector: '[appCaptcha]'
})
export class CaptchaDirective implements OnInit {

  @Output() valido = new EventEmitter<boolean>();

  private imagenElement!: HTMLElement;
  private mensajeElement!: HTMLElement;
  private botonRegenerar!: HTMLElement;

  constructor( private el: ElementRef, private renderer: Renderer2, private captchaService: CaptchaService
  ) {}

  ngOnInit() {
    this.imagenElement = this.renderer.createElement('img');
    this.renderer.setStyle(this.imagenElement, 'display', 'inline-block');
    this.renderer.setStyle(this.imagenElement, 'marginBottom', '10px');
    this.renderer.setStyle(this.imagenElement, 'width', '100px');
    this.renderer.setStyle(this.imagenElement, 'height', '100px');
    this.actualizarImagen();

    this.renderer.insertBefore(this.el.nativeElement.parentNode, this.imagenElement, this.el.nativeElement);

    this.botonRegenerar = this.renderer.createElement('button');
    this.renderer.setProperty(this.botonRegenerar, 'type', 'button');
    this.renderer.setStyle(this.botonRegenerar, 'marginLeft', '10px');
    this.renderer.setProperty(this.botonRegenerar, 'textContent', 'Cambiar Captcha');
    this.renderer.listen(this.botonRegenerar, 'click', () => {
      this.regenerar();
    });
    
    this.renderer.insertBefore(this.el.nativeElement.parentNode, this.botonRegenerar, this.el.nativeElement);

    this.mensajeElement = this.renderer.createElement('div');
    this.renderer.setStyle(this.mensajeElement, 'color', 'red');
    this.renderer.setStyle(this.mensajeElement, 'fontSize', '1em');
    this.renderer.setStyle(this.mensajeElement, 'height', '1em');
    this.renderer.insertBefore(this.el.nativeElement.parentNode, this.mensajeElement, this.el.nativeElement.nextSibling);
  }

  private actualizarImagen() {
    const url = this.captchaService.getCaptchaImagenUrl();
    this.renderer.setAttribute(this.imagenElement, 'src', url);
    this.renderer.setAttribute(this.imagenElement, 'alt', 'Captcha');
  }

  @HostListener('blur')
  validar() {
    const valor = this.el.nativeElement.value;
    const esValido = this.captchaService.validarRespuesta(Number(valor));
    if (esValido) {
      this.renderer.setProperty(this.mensajeElement, 'textContent', '');
    } else {
      this.renderer.setProperty(this.mensajeElement, 'textContent', 'Respuesta incorrecta');
    }
    this.valido.emit(esValido);
  }

  public regenerar() {
    this.captchaService.generarCaptcha();
    this.actualizarImagen();
    this.renderer.setProperty(this.mensajeElement, 'textContent', '');
    this.renderer.setProperty(this.el.nativeElement, 'value', '');
    this.valido.emit(false);
  }
}
