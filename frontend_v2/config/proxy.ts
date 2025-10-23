/**

 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  // 
  dev: {

    '/api/': {
   
      target: 'http://localhost:3000/api/',

      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
    '/profile/avatar/': {
      target: 'http://localhost:3000/',
      changeOrigin: true,
    }
  },


  test: {

    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'http://localhost:3000/',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
