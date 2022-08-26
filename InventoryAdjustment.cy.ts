const moment = require('moment')

describe('Inventory Adjustment', () => {
  const warehouseCode = 'WH-20220729-0004'
  const filterFields = ['product_code', 'product_name', 'size', 'color']
  const toggleColumnsVisibility = [
    'External Link Loss Detail ID',
    'Product Name',
    'Product Code',
    'Size',
    'Color',
  ]
  const paginationSelector = 'productOptionPagination'

  const INVENTORY_ADJUSTMENT_LIST_URL =
    '/inventory-control/arrival-purchase-process/inventory-adjustment-list/'
  const INVENTORY_ADJUSTMENT_URL =
    '/inventory-control/arrival-purchase-process/inventory-adjustment'

  before(() => {
    cy.authToken()
    cy.saveLocalStorage()
  })

  beforeEach(() => {
    cy.restoreLocalStorage()
    cy.visit(INVENTORY_ADJUSTMENT_LIST_URL)
    cy.waitVerify()

    cy.get('[data-cy="inventoryAdjustmentListTable"]').should('exist')
    cy.waitTableLoading()
  })

  it('should render without error', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()
    cy.url().should('contain', INVENTORY_ADJUSTMENT_URL)
    cy.shouldHavePageTitle('Inventory Adjustment')
    cy.get('[data-cy=submit-button]')
      .should('exist')
      .should('have.text', 'Register')
  })

  it('should show required message if field not filled', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()
    cy.get('[data-cy=submit-button]').click()
    cy.get('#error_warehouse_code').should('exist')
    cy.get('#error_warehouse_name').should('exist')
    cy.get('#error_warehouse_virtual_id').should('exist')

    cy.url().should('contain', INVENTORY_ADJUSTMENT_URL)
  })

  it('should show notification error if not enter at least one product', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get('[data-cy=submit-button]').click()

    cy.get('#error_warehouse_code').should('not.exist')
    cy.get('#error_warehouse_name').should('not.exist')
    cy.get('#error_warehouse_virtual_id').should('not.exist')

    cy.notification(
      'error',
      'exist',
      'Please enter at least one product to table below',
    )

    cy.url().should('contain', INVENTORY_ADJUSTMENT_URL)
  })

  it('should show notif error if some field in product line is not filled', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get('[data-cy="buttonAddProduct"]').click()

    cy.wait('@getProductOptions', { timeout: 30000 })
    cy.selectRowTable([0], '[data-cy="productOptionTable"] tbody')
    cy.get('[data-cy="modalButtonOk"]').click()

    cy.get('[data-cy=submit-button]').click()

    cy.notification('error', 'exist')
    cy.url().should('contain', INVENTORY_ADJUSTMENT_URL)
  })

  it('At least a list of product details Show when filter is selected', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get('[data-cy="buttonAddProduct"]').click()
    cy.wait('@getProductOptions', { timeout: 30000 })
    cy.get('[data-cy="productOptionModal"]').then((modal) => {
      cy.wrap(filterFields).each((field, index) => {
        cy.wrap(modal).find(`input#${field}`).click({ force: true })
        cy.get(`#${field}_list`)
          .parent()
          .find('div.rc-virtual-list .ant-select-item-option')
          .eq(0)
          .then((option) => {
            cy.wrap(option).invoke('text').as('selectedOption')
            cy.wrap(option).click()
          })
        cy.wrap(modal)
          .find('[data-cy="productOptionTable"] tbody tr.ant-table-row')
          .each((row) => {
            cy.get('@selectedOption').then((selectedOption) => {
              cy.wrap(row)
                .find('td')
                .eq(index + 1)
                .invoke('text')
                .should('equal', selectedOption)
            })
          })
      })
    })
  })

  it('Color and Size fields must be removed and hidden when the product code and name are removed', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get('[data-cy="buttonAddProduct"]').click()
    cy.wait('@getProductOptions', { timeout: 30000 })
    cy.get('[data-cy="productOptionModal"]').then((modal) => {
      cy.wrap(filterFields).each((field) => {
        cy.wrap(modal).find(`input#${field}`).click({ force: true })
        cy.get(`#${field}_list`)
          .parent()
          .find('div.rc-virtual-list .ant-select-item-option')
          .eq(0)
          .click()
      })
      cy.wrap(modal)
        .find(`input#product_code`)
        .parents('.ant-select')
        .find('.ant-select-clear')
        .click({ force: true })

      cy.get(`input#size`)
        .should('be.disabled')
        .parents('.ant-select-selector')
        .invoke('text')
        .should('be.empty')
      cy.get(`input#color`)
        .should('be.disabled')
        .parents('.ant-select-selector')
        .invoke('text')
        .should('be.empty')
    })
  })

  it('the title should be hidden when the minus icon is clicked/given an action', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="productTable"] thead tr th')
        .contains(column)
        .parents('th')
        .find('.anticon-minus-circle')
        .click()
    })
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="productTable"] thead tr th').should(
        'not.contain',
        column,
      )
    })
  })

  it('Visible Features should make column headers hidden/shown', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="productTable"] thead tr th')
        .contains(column)
        .parents('th')
        .find('.anticon-minus-circle')
        .click()
    })
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="productTable"] thead tr th').should(
        'not.contain',
        column,
      )
    })

    cy.get('[data-cy="productTable"] thead tr th')
      .eq(0)
      .find('.ant-table-selection-extra')
      .click()
    cy.contains('Column Visibility').click()

    cy.get('[data-cy="modalVisibility"]').then((modal) => {
      cy.wrap(toggleColumnsVisibility).each((column: string) => {
        cy.wrap(modal)
          .find('[data-cy="tableVisibility"] tbody tr.ant-table-row')
          .contains(column)
          .parents('tr')
          .find('button.ant-switch')
          .should('not.contain', '.ant-switch-checked')
          .click()
      })
      cy.wrap(modal).find('button.ant-btn-primary').click()
    })
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="productTable"] thead tr th').should('contain', column)
    })
  })

  it('The pagination should be able to display data according to the selected pagination filter', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get('[data-cy="buttonAddProduct"]').click()
    cy.wait('@getProductOptions', { timeout: 30000 })
    cy.get('[data-cy="productOptionModal"]').then((modal) => {
      cy.get(`[data-cy="${paginationSelector}"]`).should('exist')
      cy.refreshPaginationValue(paginationSelector)
      cy.checkPaginationButtonState(paginationSelector)

      cy.get(`@${paginationSelector}.listPagesButton`).then((buttons) => {
        if (buttons.length > 1) {
          cy.wait(2000)
            .get('[data-cy="productOptionTable"] tbody tr.ant-table-row')
            .each((row, index) => {
              cy.wrap(row).find('td').invoke('text').as(`row-${index}`)
            })

          cy.wrap(buttons).eq(1).click()
          cy.refreshPaginationValue(paginationSelector)
          cy.checkPaginationButtonState(paginationSelector)
          cy.wait(2000)
            .get('[data-cy="productOptionTable"] tbody tr.ant-table-row')
            .each((row, index) => {
              cy.wrap(row)
                .find('td')
                .invoke('text')
                .then((rowElement) => {
                  cy.get(`@row-${index}`).should('not.equal', rowElement)
                })
            })
        }
      })
    })
  })

  it('Should be when the warehouse code is deleted the warehouse name and Virtual warehouse are deleted and hide', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get(`input#warehouse_code`)
      .parents('.ant-select')
      .find('.ant-select-clear')
      .click({ force: true })

    cy.get(`input#warehouse_name`)
      .parents('.ant-select-selector')
      .invoke('text')
      .should('equal', 'Warehouse Name') // empty, equal to placeholder

    cy.get(`input#warehouse_virtual_id`)
      .should('be.disabled')
      .parents('.ant-select-selector')
      .invoke('text')
      .should('equal', 'Virtual Warehouse') // empty, equal to placeholder
  })

  it('should be when the warehouse Name is removed the warehouse code and Virtual warehouse are deleted and hidden', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get(`input#warehouse_name`)
      .parents('.ant-select')
      .find('.ant-select-clear')
      .click({ force: true })

    cy.get(`input#warehouse_code`)
      .parents('.ant-select-selector')
      .invoke('text')
      .should('equal', 'Warehouse Code') // empty, equal to placeholder

    cy.get(`input#warehouse_virtual_id`)
      .should('be.disabled')
      .parents('.ant-select-selector')
      .invoke('text')
      .should('equal', 'Virtual Warehouse') // empty, equal to placeholder
  })

  it('should be when the Virtual warehouse is removed the Warehouse code and Warehouse name are not deleted and hidden', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get(`input#warehouse_virtual_id`)
      .parents('.ant-select')
      .find('.ant-select-clear')
      .click({ force: true })

    cy.get(`input#warehouse_code`)
      .parents('.ant-select-selector')
      .invoke('text')
      .should('not.equal', 'Warehouse Code') // not empty, not equal to placeholder

    cy.get(`input#warehouse_name`)
      .parents('.ant-select-selector')
      .invoke('text')
      .should('not.equal', 'Warehouse Name') // not empty, not equal to placeholder
  })

  it('Should be when the Virtual warehouse is not selected and the button registered is clicked there should be a notification field that is Required', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })

    cy.get('[data-cy=submit-button]').click()
    cy.get('#error_warehouse_code').should('not.exist')
    cy.get('#error_warehouse_name').should('not.exist')
    cy.get('#error_warehouse_virtual_id').should('exist')
  })

  it('Should be that when the warehouse code and name are deleted, the virtual warehouse display the required message', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get('[data-cy=submit-button]').click()

    cy.get(`input#warehouse_code`)
      .parents('.ant-select')
      .find('.ant-select-clear')
      .click({ force: true })

    cy.get('#error_warehouse_code').should('exist')
    cy.get('#error_warehouse_name').should('exist')
    cy.get('#error_warehouse_virtual_id').should('exist')
  })

  it('The table should freeze when performing an action on the pin icon', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="productTable"] thead tr th')
        .contains(column)
        .parents('th')
        .invoke('attr', 'class')
        .should('not.contain', 'ant-table-cell-fix-sticky')
    })
    cy.get('[data-cy="productTable"] thead tr th')
      .contains(toggleColumnsVisibility[toggleColumnsVisibility.length - 1])
      .parents('th')
      .find('.anticon-pushpin')
      .click()

    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="productTable"] thead tr th')
        .contains(column)
        .parents('th')
        .invoke('attr', 'class')
        .should('contain', 'ant-table-cell-fix-sticky')
    })
  })

  it('should create new inventory adjustment', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/create/').as('create')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.intercept('*/dataset/stock.location/search_read/').as(
      'getVirtualWarehouses',
    )
    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_code').click().type(warehouseCode)

    cy.get(`#warehouse_code_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()
    cy.wait('@getVirtualWarehouses', {
      timeout: 30000,
    })
    cy.get('#warehouse_virtual_id').click()
    cy.get(`#warehouse_virtual_id_list`)
      .parent()
      .find('div.rc-virtual-list .ant-select-item-option')
      .eq(0)
      .click()

    cy.get('[data-cy="buttonAddProduct"]').click()

    cy.wait('@getProductOptions', { timeout: 30000 })
    cy.selectRowTable([0], '[data-cy="productOptionTable"] tbody')
    cy.get('[data-cy="modalButtonOk"]').click()

    cy.get('[data-cy="productTable"] tbody tr.ant-table-row')
      .eq(0)
      .find('td')
      .then((columns) => {
        cy.wrap(columns)
          .eq(6)
          .invoke('text')
          .then((qtyValue: any) => {
            const valuePlusOne = ((Number(qtyValue) || 0) + 1).toString()
            cy.wrap(columns).eq(7).find('input').type(valuePlusOne)

            cy.get('[data-cy=submit-button]').click()

            cy.wait('@create', {
              timeout: 30000,
            })
          })
      })
    cy.waitUntil(() =>
      cy.get('.ant-notification-notice-success').should('exist'),
    )

    cy.url().should('contain', INVENTORY_ADJUSTMENT_LIST_URL)
  })

  it('should populate form and table when click detail', () => {
    cy.get('[data-cy="inventoryAdjustmentListTable"]')
      .find('tbody tr.ant-table-row')
      .eq(0)
      .find('td')
      .eq(1)
      .find('a')
      .click()
    cy.waitVerify()

    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')
    cy.wait('@getWarehouses', {
      timeout: 30000,
    })

    cy.get('#warehouse_code')
      .should('be.disabled')
      .parents('.ant-select-selector')
      .find('.ant-select-selection-item')
      .invoke('text')
      .should('not.be.empty')
    cy.get('#warehouse_name')
      .should('be.disabled')
      .parents('.ant-select-selector')
      .find('.ant-select-selection-item')
      .invoke('text')
      .should('not.be.empty')
    cy.get('#warehouse_virtual_id')
      .should('be.disabled')
      .parents('.ant-select-selector')
      .find('.ant-select-selection-item')
      .invoke('text')
      .should('not.be.empty')

    cy.get('[data-cy="productTable"]')
      .find('tbody tr.ant-table-row', { timeout: 10000 })
      .should('exist')

    cy.url().should('contain', INVENTORY_ADJUSTMENT_URL)
  })

  it('should update inventory adjustment', () => {
    cy.get('[data-cy="inventoryAdjustmentListTable"]')
      .find('tbody tr.ant-table-row')
      .eq(0)
      .find('td')
      .eq(1)
      .find('a')
      .click()
    cy.waitVerify()

    cy.intercept('*/dataset/inventory.adjustment/write/').as('write')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')

    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })

    cy.get('[data-cy="productTable"] tbody tr.ant-table-row')
      .eq(0)
      .find('td')
      .then((columns) => {
        cy.wrap(columns)
          .eq(6)
          .invoke('text')
          .then((qtyValue: any) => {
            const valuePlusOne = ((Number(qtyValue) || 0) + 2).toString()
            cy.wrap(columns).eq(7).find('input').type(valuePlusOne)

            cy.get('[data-cy=submit-button]').click()

            cy.wait('@write', {
              timeout: 30000,
            })
          })
      })
    cy.waitUntil(() =>
      cy.get('.ant-notification-notice-success').should('exist'),
    )

    cy.url().should('contain', INVENTORY_ADJUSTMENT_LIST_URL)
  })
  it('should confirm inventory adjustment', () => {
    cy.get('[data-cy="inventoryAdjustmentListTable"]')
      .find('tbody tr.ant-table-row')
      .eq(0)
      .find('td')
      .eq(1)
      .find('a')
      .click()
    cy.waitVerify()

    cy.intercept(
      '*/dataset/inventory.adjustment/action_confirm_adjustment/',
    ).as('confirm')
    cy.intercept('*/dataset/stock.warehouse/search_read/').as('getWarehouses')

    cy.intercept('*/dataset/stock.quant/search_read/').as('getProductOptions')

    cy.wait('@getWarehouses', {
      timeout: 30000,
    })

    cy.get('[data-cy="confirm-button"]').click()

    cy.wait('@confirm', {
      timeout: 30000,
    })
    cy.waitUntil(() =>
      cy.get('.ant-notification-notice-success').should('exist'),
    )

    cy.url().should('contain', INVENTORY_ADJUSTMENT_LIST_URL)
  })
})
