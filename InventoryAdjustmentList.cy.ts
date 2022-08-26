const moment = require('moment')

describe('Inventory Adjustment List', () => {
  const paginationSelector = 'myPagination'

  const INVENTORY_ADJUSTMENT_LIST_URL =
    '/inventory-control/arrival-purchase-process/inventory-adjustment-list/'
  const INVENTORY_ADJUSTMENT_DETAIL_URL =
    '/inventory-control/arrival-purchase-process/inventory-adjustment'

  const toggleColumnsVisibility = [
    'Inventory Adjustment No',
    'Register PIC',
    'Register Date',
    'Warehouse Code',
  ]

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
    cy.shouldHavePageTitle('Inventory Adjustment List')
    cy.url().should('contain', INVENTORY_ADJUSTMENT_LIST_URL)
  })

  it('should be able to use pagination', () => {
    cy.get(`[data-cy="${paginationSelector}"]`).should('exist')
    cy.refreshPaginationValue(paginationSelector)
    cy.checkPaginationButtonState(paginationSelector)
    cy.get(`@${paginationSelector}.listPagesButton`).then((buttons) => {
      if (buttons.length > 1) {
        cy.get(
          '[data-cy="inventoryAdjustmentListTable"] tbody tr.ant-table-row',
        )
          .find('td')
          .eq(2)
          .invoke('text')
          .then((text) => cy.wrap(text).as('firstData'))
        cy.wrap(buttons).eq(1).click()
        cy.waitTableLoading()
        cy.refreshPaginationValue(paginationSelector)
        cy.checkPaginationButtonState(paginationSelector)
        cy.get(
          '[data-cy="inventoryAdjustmentListTable"] tbody tr.ant-table-row',
        )
          .find('td')
          .eq(2)
          .invoke('text')
          .then((text) => {
            cy.get('@firstData').should('not.equal', text)
          })
      }
    })
  })

  it('should be able to use page size', () => {
    cy.get(`[data-cy="${paginationSelector}"]`).should('exist')
    cy.refreshPaginationValue(paginationSelector)
    cy.checkPaginationButtonState(paginationSelector)
    cy.get(`@${paginationSelector}.selector`).then((selector) => {
      cy.wrap(selector).click()
      cy.get(
        '.rc-virtual-list .rc-virtual-list-holder .ant-select-item.ant-select-item-option',
      ).each((item, index) => {
        if (index <= 2) {
          cy.wrap(item).click()
          cy.refreshPaginationValue(paginationSelector)
          cy.checkPaginationButtonState(paginationSelector)
          cy.wait(2000).checkTableTotalRow(
            '[data-cy="inventoryAdjustmentListTable"] tbody tr.ant-table-row',
            paginationSelector,
          )
          if (index < 2) cy.wrap(selector).click()
        }
      })
    })
  })

  it('should go to inventory adjustment registration without error', () => {
    cy.get('[data-cy=buttonAddNew]').click()
    cy.url({ timeout: 60000 }).should(
      'contain',
      INVENTORY_ADJUSTMENT_DETAIL_URL,
    )
    cy.shouldHavePageTitle('Inventory Adjustment')
    cy.get('[data-cy=submit-button]')
      .should('exist')
      .should('have.text', 'Register')
  })

  it('should go to purchase return detail without error', () => {
    cy.get('[data-cy="inventoryAdjustmentListTable"] tbody tr.ant-table-row')
      .eq(0)
      .find('td')
      .eq(1)
      .find('a')
      .click()
    cy.waitVerify()

    cy.url({ timeout: 60000 }).should(
      'contain',
      INVENTORY_ADJUSTMENT_DETAIL_URL,
    )

    cy.shouldHavePageTitle('Inventory Adjustment')
    cy.get('[data-cy=submit-button]')
      .should('exist')
      .should('have.text', 'Register')
  })

  it('should download all data', () => {
    cy.get('[data-cy="downloadButton"]')
      .contains('Download All')
      .click()
      .parents('button')
      .should('have.class', 'ant-btn-loading')

    cy.downloadFile(
      `Inventory Adjustment List_${moment().format('YYYYMMDD_hhmm')}.xlsx`,
    )
    cy.get('[data-cy=downloadButton]')
      .contains('Download All')
      .parents('button')
      .should('not.have.class', 'ant-btn-loading')
  })

  it('should download selected data', () => {
    cy.selectRowTable(
      [0, 2, 3],
      '[data-cy="inventoryAdjustmentListTable"] tbody',
    )

    cy.get('[data-cy=downloadButton]')
      .contains('Download')
      .click()
      .parents('button')

    cy.downloadFile(
      `Inventory Adjustment List_${moment().format('YYYYMMDD_hhmm')}.xlsx`,
    )

    cy.get('[data-cy=downloadButton]').contains('Download').parents('button')
  })

  it('the title should be hidden when the minus icon is clicked/given an action', () => {
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="inventoryAdjustmentListTable"] thead tr th')
        .contains(column)
        .parents('th')
        .find('.anticon-minus-circle')
        .click()
    })
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="inventoryAdjustmentListTable"] thead tr th').should(
        'not.contain',
        column,
      )
    })
  })

  it('Visible Features should make column headers hidden/shown', () => {
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="inventoryAdjustmentListTable"] thead tr th')
        .contains(column)
        .parents('th')
        .find('.anticon-minus-circle')
        .click()
    })
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="inventoryAdjustmentListTable"] thead tr th').should(
        'not.contain',
        column,
      )
    })

    cy.get('[data-cy="inventoryAdjustmentListTable"] thead tr th')
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
      cy.get('[data-cy="inventoryAdjustmentListTable"] thead tr th').should(
        'contain',
        column,
      )
    })
  })

  it('The table should freeze when performing an action on the pin icon', () => {
    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="inventoryAdjustmentListTable"] thead tr th')
        .contains(column)
        .parents('th')
        .invoke('attr', 'class')
        .should('not.contain', 'ant-table-cell-fix-sticky')
    })
    cy.get('[data-cy="inventoryAdjustmentListTable"] thead tr th')
      .contains(toggleColumnsVisibility[toggleColumnsVisibility.length - 1])
      .parents('th')
      .find('.anticon-pushpin')
      .click()

    cy.wrap(toggleColumnsVisibility).each((column: string) => {
      cy.get('[data-cy="inventoryAdjustmentListTable"] thead tr th')
        .contains(column)
        .parents('th')
        .invoke('attr', 'class')
        .should('contain', 'ant-table-cell-fix-sticky')
    })
  })
})
