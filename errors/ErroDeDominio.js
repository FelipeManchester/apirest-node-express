class ErroDeDominio extends Error {
  constructor(mensagem, status = 422) {
    super(mensagem);
    this.name = 'ErroDeDominio';
    this.status = status;
  }
}

module.exports = ErroDeDominio;
