import * as React from 'react'
import { CIStatus } from './ci-status'
import { GitHubRepository } from '../../models/github-repository'
import { Dispatcher } from '../dispatcher'
import { ICombinedRefCheck, isSuccess } from '../../lib/ci-checks/ci-checks'
import { getPullRequestCommitRef } from '../../models/pull-request'
import { Button } from '../lib/button'

interface IPullRequestBadgeProps {
  /** The pull request's number. */
  readonly number: number

  readonly dispatcher: Dispatcher

  /** The GitHub repository to use when looking up commit status. */
  readonly repository: GitHubRepository

  /** Whether or not the check runs popover is open */
  readonly showCIStatusPopover?: boolean

  readonly onBadgeRef?: (ref: HTMLButtonElement | null) => void

  /** The GitHub repository to use when looking up commit status. */
  readonly onBadgeClick?: () => void

  /** When the bottom edge of the pull request badge position changes. For
   * example, on a mac, this changes when the user maximizes Desktop. */
  readonly onBadgeBottomPositionUpdate?: (bottom: number) => void
}

interface IPullRequestBadgeState {
  /** Whether or not the CI status is showing a status */
  readonly isStatusShowing: boolean
  readonly check: ICombinedRefCheck | null
}

/** The pull request info badge. */
export class PullRequestBadge extends React.Component<
  IPullRequestBadgeProps,
  IPullRequestBadgeState
> {
  private badgeRef: HTMLButtonElement | null = null
  private badgeBoundingBottom: number = 0

  public constructor(props: IPullRequestBadgeProps) {
    super(props)
    this.state = {
      isStatusShowing: false,
      check: null,
    }
  }

  public componentDidUpdate() {
    if (this.badgeRef === null) {
      return
    }

    if (
      this.badgeRef.getBoundingClientRect().bottom !== this.badgeBoundingBottom
    ) {
      this.badgeBoundingBottom = this.badgeRef.getBoundingClientRect().bottom
      this.props.onBadgeBottomPositionUpdate?.(this.badgeBoundingBottom)
    }
  }

  private onRef = (badgeRef: HTMLButtonElement | null) => {
    this.badgeRef = badgeRef
    this.props.onBadgeRef?.(badgeRef)
  }

  private onBadgeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!this.state.isStatusShowing) {
      return
    }

    event.stopPropagation()
    this.props.onBadgeClick?.()
  }

  private onCheckChange = (check: ICombinedRefCheck | null) => {
    this.setState({ isStatusShowing: check !== null, check })
  }

  public render() {
    const ref = getPullRequestCommitRef(this.props.number)
    return (
      <Button
        className="pr-badge"
        onClick={this.onBadgeClick}
        onButtonRef={this.onRef}
        disabled={!this.state.isStatusShowing}
        ariaHaspopup={true}
        ariaExpanded={this.props.showCIStatusPopover === true}
        tooltip={getRefCheckSummary(this.state.check)}
      >
        <span className="number">#{this.props.number}</span>
        <CIStatus
          commitRef={ref}
          dispatcher={this.props.dispatcher}
          repository={this.props.repository}
          onCheckChange={this.onCheckChange}
        />
      </Button>
    )
  }
}

/**
 * Convert the combined check to an app-friendly string.
 */
function getRefCheckSummary(check: ICombinedRefCheck | null) {
  if (check === null) {
    return undefined
  }

  if (check.checks.length === 1) {
    const { name, description } = check.checks[0]
    return `${name}: ${description}`
  }

  const successCount = check.checks.reduce(
    (acc, cur) => acc + (isSuccess(cur) ? 1 : 0),
    0
  )

  return `${successCount}/${check.checks.length} checks OK`
}
